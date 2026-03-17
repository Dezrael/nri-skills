import React, { useState } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import { evaluateDiceExpression } from "../../../utils/cooldownManager";
import {
  createSkill,
  deleteSkill,
  isUnauthorizedError,
  updateSkill,
} from "../../../api/nriApi";
import "./SkillsTable.css";

const validateTurnsFormula = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed === "∞") return "";
  return evaluateDiceExpression(trimmed, { rollDice: false }) !== null
    ? ""
    : "Неверный формат. Пример: 3, 2d6, 1+d4";
};

const validateTimeFormula = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed === "∞") return "";
  if (evaluateDiceExpression(trimmed, { rollDice: false }) !== null) return "";
  const timeUnitPattern =
    /[0-9dD+\-*/().]+\s*(день|дня|дней|days?|час|часа|часов|hours?|минута|минуты|минут|minutes?)/i;
  if (timeUnitPattern.test(trimmed)) return "";
  return "Неверный формат. Пример: 2d6, 10+2d4, 2 часа, 1d4 часов 30 минут";
};

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
  const [formulaErrors, setFormulaErrors] = useState<Record<string, string>>(
    {},
  );

  const handleAdd = () => {
    const newSkill: PlayerSkill = {
      name: "",
      category: "",
      actionType: "",
      range: "",
      stat: "",
      durationInCombat: "",
      durationOutOfCombat: "",
      damage: "",
      savingThrow: "",
      inCombatCooldown: "",
      outCombatCooldown: "",
      cooldownType: "",
      outCombatCharges: "",
      shortDescription: "",
      description: "",
      concentration: false,
      isChosen: false,
    };
    setEditingSkill(newSkill);
    setIsAdding(true);
    setFormulaErrors({});
  };

  const handleEdit = (skill: PlayerSkill) => {
    setEditingSkill({ ...skill });
    setIsAdding(false);
    setFormulaErrors({});
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

    const activeFormulaErrors = Object.values(formulaErrors).filter(Boolean);
    if (activeFormulaErrors.length > 0) {
      onNotify("error", "Исправьте ошибки в полях формул перед сохранением");
      return;
    }

    const hasCharges = (Number(editingSkill.outCombatCharges) || 0) > 0;
    const skillToSave: PlayerSkill = {
      ...editingSkill,
      cooldownType: hasCharges ? editingSkill.cooldownType || "" : "",
    };

    if (
      !skillToSave.name.trim() ||
      !skillToSave.shortDescription.trim() ||
      !skillToSave.description.trim()
    ) {
      onNotify(
        "error",
        "Заполните обязательные поля: Название, Краткое описание и Полное описание",
      );
      return;
    }

    if (hasCharges && !skillToSave.cooldownType?.trim()) {
      onNotify(
        "error",
        "Если у заклинания есть заряды, нужно выбрать тип перезарядки",
      );
      return;
    }

    try {
      if (isAdding) {
        const created = await createSkill(
          {
            ...skillToSave,
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

        const skillId = editingSkill.id;
        const updatedFromApi = await updateSkill(
          skillId,
          {
            ...skillToSave,
            className,
          },
          authToken,
        );

        const index = skills.findIndex((s) => s.id === skillId);
        if (index !== -1) {
          const updatedSkills = [...skills];
          updatedSkills[index] = updatedFromApi;
          onUpdate(updatedSkills);
          onNotify("success", "Заклинание обновлено");
        }
      }

      setEditingSkill(null);
      setIsAdding(false);
      setFormulaErrors({});
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
    setFormulaErrors({});
  };

  const updateEditingSkill = (field: keyof PlayerSkill, value: any) => {
    if (!editingSkill) return;

    if (field === "outCombatCharges") {
      const numericValue = Number(value) || 0;
      setEditingSkill({
        ...editingSkill,
        outCombatCharges: value,
        cooldownType: numericValue > 0 ? editingSkill.cooldownType : "",
      });
      return;
    }

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
              <label>Категория:</label>
              <input
                type="text"
                value={editingSkill.category || ""}
                onChange={(e) => updateEditingSkill("category", e.target.value)}
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
              <label>Урон/исцеление:</label>
              <input
                type="text"
                value={editingSkill.damage}
                onChange={(e) => updateEditingSkill("damage", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Длительность в бою:</label>
              <input
                type="text"
                value={editingSkill.durationInCombat}
                className={formulaErrors.durationInCombat ? "input-error" : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateEditingSkill("durationInCombat", val);
                  setFormulaErrors((prev) => ({
                    ...prev,
                    durationInCombat: validateTurnsFormula(val),
                  }));
                }}
              />
              {formulaErrors.durationInCombat && (
                <span className="formula-error">
                  {formulaErrors.durationInCombat}
                </span>
              )}
            </div>
            <div className="form-field">
              <label>КД в бою:</label>
              <input
                type="text"
                value={editingSkill.inCombatCooldown}
                className={formulaErrors.inCombatCooldown ? "input-error" : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateEditingSkill("inCombatCooldown", val);
                  setFormulaErrors((prev) => ({
                    ...prev,
                    inCombatCooldown: validateTurnsFormula(val),
                  }));
                }}
              />
              {formulaErrors.inCombatCooldown && (
                <span className="formula-error">
                  {formulaErrors.inCombatCooldown}
                </span>
              )}
            </div>
            <div className="form-field">
              <label>Длительность вне боя:</label>
              <input
                type="text"
                value={editingSkill.durationOutOfCombat}
                className={
                  formulaErrors.durationOutOfCombat ? "input-error" : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  updateEditingSkill("durationOutOfCombat", val);
                  setFormulaErrors((prev) => ({
                    ...prev,
                    durationOutOfCombat: validateTimeFormula(val),
                  }));
                }}
              />
              {formulaErrors.durationOutOfCombat && (
                <span className="formula-error">
                  {formulaErrors.durationOutOfCombat}
                </span>
              )}
            </div>
            <div className="form-field">
              <label>КД вне боя:</label>
              <input
                type="text"
                value={editingSkill.outCombatCooldown}
                className={formulaErrors.outCombatCooldown ? "input-error" : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateEditingSkill("outCombatCooldown", val);
                  setFormulaErrors((prev) => ({
                    ...prev,
                    outCombatCooldown: validateTimeFormula(val),
                  }));
                }}
              />
              {formulaErrors.outCombatCooldown && (
                <span className="formula-error">
                  {formulaErrors.outCombatCooldown}
                </span>
              )}
            </div>
            <div className="form-field">
              <label>Заряды:</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={editingSkill.outCombatCharges}
                onChange={(e) => {
                  if (!e.target.value || /^\d+$/.test(e.target.value))
                    updateEditingSkill("outCombatCharges", e.target.value);
                }}
              />
            </div>
            <div className="form-field">
              <label>
                Тип перезарядки
                {(Number(editingSkill.outCombatCharges) || 0) > 0 ? "*" : ""}:
              </label>
              <select
                value={
                  (Number(editingSkill.outCombatCharges) || 0) > 0
                    ? editingSkill.cooldownType || ""
                    : ""
                }
                disabled={(Number(editingSkill.outCombatCharges) || 0) === 0}
                onChange={(e) =>
                  updateEditingSkill("cooldownType", e.target.value)
                }
              >
                <option value="">Не выбрано</option>
                <option value="До короткого отдыха">До короткого отдыха</option>
                <option value="До долгого отдыха">До долгого отдыха</option>
              </select>
            </div>
            <div className="form-field">
              <label>Спасбросок:</label>
              <input
                type="text"
                value={editingSkill.savingThrow || ""}
                onChange={(e) =>
                  updateEditingSkill("savingThrow", e.target.value)
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
              <th>Урон/исцеление</th>
              <th>КД в бою</th>
              <th>Тип перезарядки</th>
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
                <td>{skill.cooldownType || "-"}</td>
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
