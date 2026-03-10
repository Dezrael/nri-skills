import React, { useEffect, useRef, useState } from "react";
import {
  PlayerSkill,
  SkillsDatabase,
  PassiveAbility,
  Mushroom,
} from "../../../types/PlayerSkill";
import ClassSelector from "../../ClassSelector/ClassSelector";
import SkillsTable from "../SkillsTable";
import PassivesTable from "../PassivesTable";
import MushroomsTable from "../MushroomsTable";
import AdminToast, { AdminToastType } from "../AdminToast/AdminToast";
import {
  bulkImportData,
  createClass,
  deleteClass,
  fetchAllSkillsData,
  isUnauthorizedError,
} from "../../../api/nriApi";
import "./DataManager.css";

interface DataManagerProps {
  authToken: string;
  onAuthExpired: () => void;
}

function DataManager({ authToken, onAuthExpired }: DataManagerProps) {
  const [skillsData, setSkillsData] = useState<SkillsDatabase>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("skills");
  const [isReloading, setIsReloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [toast, setToast] = useState<{
    type: AdminToastType;
    message: string;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (type: AdminToastType, message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  // Загрузка данных из JSON при загрузке
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const data: SkillsDatabase = await fetchAllSkillsData();
        setSkillsData(data);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Неизвестная ошибка при загрузке",
        );
        setLoading(false);
      }
    };

    loadSkills();
  }, []);

  const reloadData = async () => {
    try {
      setIsReloading(true);
      const data = await fetchAllSkillsData();
      setSkillsData(data);
      setError(null);
      showToast("success", "Данные обновлены с сервера");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неизвестная ошибка при загрузке",
      );
      showToast("error", "Не удалось обновить данные");
    } finally {
      setIsReloading(false);
    }
  };

  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
  };

  const handleCreateClass = async () => {
    const trimmed = newClassName.trim();
    if (!trimmed) return;

    if (skillsData[trimmed] !== undefined) {
      showToast("error", `Класс "${trimmed}" уже существует`);
      return;
    }

    try {
      setIsSubmittingClass(true);
      await createClass(trimmed, authToken);
      const newData = {
        ...skillsData,
        [trimmed]: { skills: [], passives: [], mushrooms: [] },
      };
      setSkillsData(newData);
      setSelectedClass(trimmed);
      setNewClassName("");
      setIsCreatingClass(false);
      showToast("success", `Класс "${trimmed}" создан`);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        onAuthExpired();
        return;
      }
      showToast(
        "error",
        err instanceof Error ? err.message : "Ошибка при создании класса",
      );
    } finally {
      setIsSubmittingClass(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    if (
      !window.confirm(
        `Удалить класс "${selectedClass}" и все его данные? Это действие необратимо.`,
      )
    )
      return;

    const classToDelete = selectedClass;
    try {
      setIsDeletingClass(true);
      await deleteClass(classToDelete, authToken);
      const newData = { ...skillsData };
      delete newData[classToDelete];
      setSkillsData(newData);
      setSelectedClass(null);
      showToast("success", `Класс "${classToDelete}" удалён`);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        onAuthExpired();
        return;
      }
      showToast(
        "error",
        err instanceof Error ? err.message : "Ошибка при удалении класса",
      );
    } finally {
      setIsDeletingClass(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      source: "nri-skills-admin",
      data: skillsData,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `nri-skills-export-${datePart}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const normalizeImportedData = (raw: unknown): SkillsDatabase => {
    const maybeWrapped = raw as { data?: unknown };
    const data = maybeWrapped?.data ?? raw;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Некорректный формат JSON");
    }

    const result: SkillsDatabase = {};
    Object.entries(data as Record<string, unknown>).forEach(
      ([className, value]) => {
        const classData = value as {
          skills?: unknown;
          passives?: unknown;
          mushrooms?: unknown;
        };

        result[className] = {
          skills: Array.isArray(classData.skills)
            ? (classData.skills as PlayerSkill[])
            : [],
          passives: Array.isArray(classData.passives)
            ? (classData.passives as PassiveAbility[])
            : [],
          mushrooms: Array.isArray(classData.mushrooms)
            ? (classData.mushrooms as Mushroom[])
            : [],
        };
      },
    );

    return result;
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const normalized = normalizeImportedData(parsed);

      if (Object.keys(normalized).length === 0) {
        throw new Error("В файле нет данных классов");
      }

      const parsedObject = parsed as {
        exportedAt?: unknown;
        source?: unknown;
      };

      const payload = {
        exportedAt:
          typeof parsedObject.exportedAt === "string"
            ? parsedObject.exportedAt
            : new Date().toISOString(),
        source:
          typeof parsedObject.source === "string"
            ? parsedObject.source
            : "nri-skills-admin-import",
        data: normalized,
      };

      const result = await bulkImportData(payload, authToken);
      await reloadData();
      setSelectedClass(null);
      setActiveTab("skills");
      showToast(
        "success",
        `Импорт завершен: классов ${result.classes}, скиллов ${result.skills}, пассивок ${result.passives}, грибов ${result.mushrooms}.`,
      );
    } catch (err) {
      if (isUnauthorizedError(err)) {
        onAuthExpired();
        return;
      }
      showToast(
        "error",
        err instanceof Error
          ? `Ошибка импорта: ${err.message}`
          : "Ошибка импорта JSON",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const classes = Object.keys(skillsData);

  const tabs = [
    { id: "skills", label: "Заклинания" },
    { id: "passives", label: "Пассивные способности" },
    { id: "mushrooms", label: "Грибы" },
  ];

  if (loading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  return (
    <div className="data-manager">
      <div className="data-controls">
        <button
          onClick={reloadData}
          className="load-btn"
          disabled={isReloading || isImporting}
        >
          <span
            className="material-symbols-rounded btn-icon"
            aria-hidden="true"
          >
            sync
          </span>
          {isReloading ? "Обновление..." : "Обновить данные с сервера"}
        </button>
        <button onClick={handleExportData} className="export-btn">
          <span
            className="material-symbols-rounded btn-icon"
            aria-hidden="true"
          >
            download
          </span>
          Экспорт JSON
        </button>
        <button
          onClick={handleImportClick}
          className="import-btn"
          disabled={isImporting || isReloading}
        >
          <span
            className="material-symbols-rounded btn-icon"
            aria-hidden="true"
          >
            upload_file
          </span>
          {isImporting ? "Импорт..." : "Импорт JSON"}
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="import-input-hidden"
        />
      </div>

      {toast && (
        <AdminToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="class-management">
        {isCreatingClass ? (
          <div className="create-class-form">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
              placeholder="Название класса"
              autoFocus
              disabled={isSubmittingClass}
              className="create-class-input"
            />
            <button
              onClick={handleCreateClass}
              disabled={isSubmittingClass || !newClassName.trim()}
              className="confirm-create-btn"
            >
              {isSubmittingClass ? "Создание..." : "Создать"}
            </button>
            <button
              onClick={() => {
                setIsCreatingClass(false);
                setNewClassName("");
              }}
              disabled={isSubmittingClass}
              className="cancel-create-btn"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingClass(true)}
            className="create-class-btn"
          >
            <span
              className="material-symbols-rounded btn-icon"
              aria-hidden="true"
            >
              add
            </span>
            Создать класс
          </button>
        )}
        {selectedClass && (
          <button
            onClick={handleDeleteClass}
            disabled={isDeletingClass}
            className="delete-class-btn"
          >
            <span
              className="material-symbols-rounded btn-icon"
              aria-hidden="true"
            >
              delete
            </span>
            {isDeletingClass ? "Удаление..." : `Удалить ${selectedClass}`}
          </button>
        )}
      </div>

      <ClassSelector
        classes={classes}
        selectedClass={selectedClass}
        onSelectClass={handleSelectClass}
      />

      {selectedClass && (
        <>
          <div className="admin-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "skills" && (
            <SkillsTable
              authToken={authToken}
              onAuthExpired={onAuthExpired}
              onNotify={showToast}
              className={selectedClass}
              skills={skillsData[selectedClass]?.skills || []}
              onUpdate={(updatedSkills: PlayerSkill[]) => {
                const newData = {
                  ...skillsData,
                  [selectedClass]: {
                    ...skillsData[selectedClass],
                    skills: updatedSkills,
                  },
                };
                setSkillsData(newData);
              }}
            />
          )}

          {activeTab === "passives" && (
            <PassivesTable
              authToken={authToken}
              onAuthExpired={onAuthExpired}
              onNotify={showToast}
              className={selectedClass}
              passives={skillsData[selectedClass]?.passives || []}
              onUpdate={(updatedPassives: PassiveAbility[]) => {
                const newData = {
                  ...skillsData,
                  [selectedClass]: {
                    ...skillsData[selectedClass],
                    passives: updatedPassives,
                  },
                };
                setSkillsData(newData);
              }}
            />
          )}

          {activeTab === "mushrooms" && (
            <MushroomsTable
              authToken={authToken}
              onAuthExpired={onAuthExpired}
              onNotify={showToast}
              className={selectedClass}
              mushrooms={skillsData[selectedClass]?.mushrooms || []}
              onUpdate={(updatedMushrooms: Mushroom[]) => {
                const newData = {
                  ...skillsData,
                  [selectedClass]: {
                    ...skillsData[selectedClass],
                    mushrooms: updatedMushrooms,
                  },
                };
                setSkillsData(newData);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default DataManager;
