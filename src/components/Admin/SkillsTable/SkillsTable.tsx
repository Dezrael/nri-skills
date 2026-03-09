import React, { useState } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import "./SkillsTable.css";

interface SkillsTableProps {
  className: string;
  skills: PlayerSkill[];
  onUpdate: (skills: PlayerSkill[]) => void;
}

function SkillsTable({ className, skills, onUpdate }: SkillsTableProps) {
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

  const handleDelete = (index: number) => {
    if (window.confirm("Вы уверены, что хотите удалить это заклинание?")) {
      const updatedSkills = skills.filter((_, i) => i !== index);
      onUpdate(updatedSkills);
    }
  };

  const handleSave = () => {
    if (!editingSkill) return;

    if (isAdding) {
      onUpdate([...skills, editingSkill]);
    } else {
      const index = skills.findIndex((s) => s.name === editingSkill.name);
      if (index !== -1) {
        const updatedSkills = [...skills];
        updatedSkills[index] = editingSkill;
        onUpdate(updatedSkills);
      }
    }

    setEditingSkill(null);
    setIsAdding(false);
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
          ➕ Добавить заклинание
        </button>
      </div>

      {editingSkill && (
        <div className="edit-form">
          <h4>
            {isAdding ? "Добавление заклинания" : "Редактирование заклинания"}
          </h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Название:</label>
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
              <label>Краткое описание:</label>
              <textarea
                value={editingSkill.shortDescription}
                onChange={(e) =>
                  updateEditingSkill("shortDescription", e.target.value)
                }
                rows={2}
              />
            </div>
            <div className="form-field full-width">
              <label>Полное описание:</label>
              <textarea
                value={editingSkill.description}
                onChange={(e) =>
                  updateEditingSkill("description", e.target.value)
                }
                rows={3}
              />
            </div>
            <div className="form-field">
              <label>
                <input
                  type="checkbox"
                  checked={editingSkill.concentration}
                  onChange={(e) =>
                    updateEditingSkill("concentration", e.target.checked)
                  }
                />
                Требует концентрации
              </label>
            </div>
            <div className="form-field">
              <label>
                <input
                  type="checkbox"
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
              💾 Сохранить
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              ❌ Отмена
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
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="delete-btn"
                  >
                    🗑️
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
