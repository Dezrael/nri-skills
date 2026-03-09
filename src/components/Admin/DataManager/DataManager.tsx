import React, { useState, useEffect } from "react";
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
import "./DataManager.css";

function DataManager() {
  const [skillsData, setSkillsData] = useState<SkillsDatabase>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("skills");

  // Загрузка данных из JSON при загрузке
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch("/data/skills.json");
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные");
        }
        const data: SkillsDatabase = await response.json();
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

  // Сохранение данных в localStorage (имитация сохранения)
  const saveData = (newData: SkillsDatabase) => {
    setSkillsData(newData);
    localStorage.setItem("skillsData", JSON.stringify(newData));
    alert("Данные сохранены! (В localStorage для демонстрации)");
  };

  // Загрузка данных из localStorage
  const loadFromStorage = () => {
    const stored = localStorage.getItem("skillsData");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSkillsData(data);
        alert("Данные загружены из localStorage!");
      } catch (err) {
        alert("Ошибка при загрузке данных из localStorage");
      }
    } else {
      alert("Нет сохраненных данных в localStorage");
    }
  };

  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
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
        <button onClick={() => saveData(skillsData)} className="save-btn">
          💾 Сохранить данные
        </button>
        <button onClick={loadFromStorage} className="load-btn">
          📁 Загрузить из хранилища
        </button>
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
