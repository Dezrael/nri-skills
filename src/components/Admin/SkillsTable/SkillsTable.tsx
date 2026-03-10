import React, { useState } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import {
  createSkill,
  deleteSkill,
  isUnauthorizedError,
  updateSkill,
} from "../../../api/nriApi";
import "./SkillsTable.css";

interface SkillsTableProps {
  authToken: string;
  onAuthExpired: () => void;
  onNotify: (type: "success" | "error" | "info", message: string) => void;
  className: string;
  skills: PlayerSkill[];
  onUpdate: (skills: PlayerSkill[]) => void;
}

function SkillsTable({
  authToken,
  onAuthExpired,
  onNotify,
  className,
  skills,
  onUpdate,
}: SkillsTableProps) {
  const [editingSkill, setEditingSkill] = useState<PlayerSkill | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    const newSkill: PlayerSkill = {
      name: "",
      actionType: "",
      range: "",
      stat: "",
      duration: "",
      damage: "",
      inCombatCooldown: "",
      outCombatCooldown: "",
      outCombatCharges: "",
      shortDescription: "",
      description: "",
      concentration: false,
      isChosen: false,
    };
    setEditingSkill(newSkill);
    setIsAdding(true);
  };

  const handleEdit = (skill: PlayerSkill) => {
    setEditingSkill({ ...skill });
    setIsAdding(false);
  };

  const handleDelete = async (index: number) => {
    if (window.confirm("Вы уверены, что хотите удалить это заклинание?")) {
      const skillToDelete = skills[index];
      try {
        if (skillToDelete?.id) {
          await deleteSkill(skillToDelete.id, authToken);
        }
        const updatedSkills = skills.filter((_, i) => i !== index);
        onUpdate(updatedSkills);
        onNotify("success", "Заклинание удалено");
      } catch (err) {
        if (isUnauthorizedError(err)) {
          onAuthExpired();
          return;
        }
        onNotify(
          "error",
          err instanceof Error
            ? `Ошибка удаления: ${err.message}`
            : "Ошибка удаления",
        );
      }
    }
  };

  const handleSave = async () => {
    if (!editingSkill) return;

    if (
      !editingSkill.name.trim() ||
      !editingSkill.shortDescription.trim() ||
      !editingSkill.description.trim()
    ) {
      onNotify(
        "error",
        "Заполните обязательные поля: Название, Краткое описание и Полное описание",
      );
      return;
    }

    try {
      if (isAdding) {
        const created = await createSkill(
          {
            ...editingSkill,
            className,
          },
          authToken,
        );
        onUpdate([...skills, created]);
        onNotify("success", "Заклинание создано");
      } else {
        if (!editingSkill.id) {
          throw new Error("У скилла отсутствует ID");
        }

        const updatedFromApi = await updateSkill(
          editingSkill.id,
          {
            ...editingSkill,
            className,
          },
          authToken,
        );

        const index = skills.findIndex((s) => s.id === editingSkill.id);
        if (index !== -1) {
          const updatedSkills = [...skills];
          updatedSkills[index] = updatedFromApi;
          onUpdate(updatedSkills);
          onNotify("success", "Заклинание обновлено");
        }
      }

      setEditingSkill(null);
      setIsAdding(false);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        onAuthExpired();
        return;
      }
      onNotify(
        "error",
        err instanceof Error
          ? `Ошибка сохранения: ${err.message}`
          : "Ошибка сохранения",
      );
    }
  };

  const handleCancel = () => {
    setEditingSkill(null);
    setIsAdding(false);
  };

  const updateEditingSkill = (field: keyof PlayerSkill, value: any) => {
    if (!editingSkill) return;
    setEditingSkill({ ...editingSkill, [field]: value });
  };

  return (
    <div className="skills-table-container">
      <div className="table-header">
        <h3>Заклинания класса: {className}</h3>
        <button onClick={handleAdd} className="add-btn">
          <span
            className="material-symbols-rounded table-btn-icon"
            aria-hidden="true"
          >
            add
          </span>
          Добавить заклинание
        </button>
      </div>

      {editingSkill && (
        <div className="edit-form">
          <h4>
            {isAdding ? "Добавление заклинания" : "Редактирование заклинания"}
          </h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Название* :</label>
              <input
                type="text"
                value={editingSkill.name}
                onChange={(e) => updateEditingSkill("name", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Тип действия:</label>
              <input
                type="text"
                value={editingSkill.actionType}
                onChange={(e) =>
                  updateEditingSkill("actionType", e.target.value)
                }
              />
            </div>
            <div className="form-field">
              <label>Дальность:</label>
              <input
                type="text"
                value={editingSkill.range}
                onChange={(e) => updateEditingSkill("range", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Характеристика:</label>
              <input
                type="text"
                value={editingSkill.stat}
                onChange={(e) => updateEditingSkill("stat", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Длительность:</label>
              <input
                type="text"
                value={editingSkill.duration}
                onChange={(e) => updateEditingSkill("duration", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Урон:</label>
              <input
                type="text"
                value={editingSkill.damage}
                onChange={(e) => updateEditingSkill("damage", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>КД в бою:</label>
              <input
                type="text"
                value={editingSkill.inCombatCooldown}
                onChange={(e) =>
                  updateEditingSkill("inCombatCooldown", e.target.value)
                }
              />
            </div>
            <div className="form-field">
              <label>КД вне боя:</label>
              <input
                type="text"
                value={editingSkill.outCombatCooldown}
                onChange={(e) =>
                  updateEditingSkill("outCombatCooldown", e.target.value)
                }
              />
            </div>
            <div className="form-field">
              <label>Заряды вне боя:</label>
              <input
                type="text"
                value={editingSkill.outCombatCharges}
                onChange={(e) =>
                  updateEditingSkill("outCombatCharges", e.target.value)
                }
              />
            </div>
            <div className="form-field full-width">
              <label>Краткое описание* :</label>
              <textarea
                value={editingSkill.shortDescription}
                onChange={(e) =>
                  updateEditingSkill("shortDescription", e.target.value)
                }
                rows={2}
              />
            </div>
            <div className="form-field full-width">
              <label>Полное описание* :</label>
              <textarea
                value={editingSkill.description}
                onChange={(e) =>
                  updateEditingSkill("description", e.target.value)
                }
                rows={3}
              />
            </div>
            <div className="form-field full-width checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={editingSkill.concentration}
                  onChange={(e) =>
                    updateEditingSkill("concentration", e.target.checked)
                  }
                />
                Требует концентрации
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={editingSkill.isChosen}
                  onChange={(e) =>
                    updateEditingSkill("isChosen", e.target.checked)
                  }
                />
                Выбрано игроком
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleSave} className="save-btn">
              <span
                className="material-symbols-rounded table-btn-icon"
                aria-hidden="true"
              >
                save
              </span>
              Сохранить
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              <span
                className="material-symbols-rounded table-btn-icon"
                aria-hidden="true"
              >
                close
              </span>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="skills-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип действия</th>
              <th>Дальность</th>
              <th>Характеристика</th>
              <th>Урон</th>
              <th>КД в бою</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill, index) => (
              <tr key={index}>
                <td>{skill.name}</td>
                <td>{skill.actionType}</td>
                <td>{skill.range}</td>
                <td>{skill.stat}</td>
                <td>{skill.damage}</td>
                <td>{skill.inCombatCooldown}</td>
                <td>
                  <button
                    onClick={() => handleEdit(skill)}
                    className="edit-btn"
                  >
                    <span
                      className="material-symbols-rounded action-icon"
                      aria-hidden="true"
                    >
                      edit_square
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="delete-btn"
                  >
                    <span
                      className="material-symbols-rounded action-icon"
                      aria-hidden="true"
                    >
                      delete
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SkillsTable;
