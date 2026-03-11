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

type OutCombatParts = {
  days: string;
  hours: string;
  minutes: string;
};

const pluralizeRu = (
  value: number,
  one: string,
  few: string,
  many: string,
): string => {
  const mod100 = value % 100;
  const mod10 = value % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }

  if (mod10 === 1) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }

  return many;
};

const parseOutCombatCooldown = (value: string): OutCombatParts => {
  const parts: OutCombatParts = {
    days: "",
    hours: "",
    minutes: "",
  };

  const matches = Array.from(
    value.matchAll(
      /(\d+)\s*(день|дня|дней|час|часа|часов|минута|минуты|минут|day|days|hour|hours|minute|minutes)/gi,
    ),
  );

  for (const match of matches) {
    const amount = match[1];
    const unit = match[2].toLowerCase();

    if (["день", "дня", "дней", "day", "days"].includes(unit)) {
      parts.days = amount;
    }

    if (["час", "часа", "часов", "hour", "hours"].includes(unit)) {
      parts.hours = amount;
    }

    if (["минута", "минуты", "минут", "minute", "minutes"].includes(unit)) {
      parts.minutes = amount;
    }
  }

  return parts;
};

const formatOutCombatCooldown = ({
  days,
  hours,
  minutes,
}: OutCombatParts): string => {
  const daysNumber = Number(days) || 0;
  const hoursNumber = Number(hours) || 0;
  const minutesNumber = Number(minutes) || 0;

  const resultParts: string[] = [];

  if (daysNumber > 0) {
    resultParts.push(
      `${daysNumber} ${pluralizeRu(daysNumber, "день", "дня", "дней")}`,
    );
  }

  if (hoursNumber > 0) {
    resultParts.push(
      `${hoursNumber} ${pluralizeRu(hoursNumber, "час", "часа", "часов")}`,
    );
  }

  if (minutesNumber > 0) {
    resultParts.push(
      `${minutesNumber} ${pluralizeRu(minutesNumber, "минута", "минуты", "минут")}`,
    );
  }

  return resultParts.join(" ");
};

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
  const [outCombatParts, setOutCombatParts] = useState<OutCombatParts>({
    days: "",
    hours: "",
    minutes: "",
  });
  const [durationOutOfCombatParts, setDurationOutOfCombatParts] =
    useState<OutCombatParts>({
      days: "",
      hours: "",
      minutes: "",
    });

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
    setOutCombatParts({ days: "", hours: "", minutes: "" });
    setDurationOutOfCombatParts({ days: "", hours: "", minutes: "" });
    setIsAdding(true);
  };

  const handleEdit = (skill: PlayerSkill) => {
    setEditingSkill({ ...skill });
    setOutCombatParts(parseOutCombatCooldown(skill.outCombatCooldown || ""));
    setDurationOutOfCombatParts(
      parseOutCombatCooldown(skill.durationOutOfCombat || ""),
    );
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

    const outCombatCooldown = formatOutCombatCooldown(outCombatParts);
    const durationOutOfCombat = formatOutCombatCooldown(
      durationOutOfCombatParts,
    );
    const hasCharges = (Number(editingSkill.outCombatCharges) || 0) > 0;
    const skillToSave: PlayerSkill = {
      ...editingSkill,
      outCombatCooldown,
      durationOutOfCombat,
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
    setOutCombatParts({ days: "", hours: "", minutes: "" });
    setDurationOutOfCombatParts({ days: "", hours: "", minutes: "" });
    setIsAdding(false);
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

  const updateOutCombatPart = (field: keyof OutCombatParts, value: string) => {
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    setOutCombatParts((prev) => ({
      ...prev,
      [field]: value,
    }));
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
                inputMode="numeric"
                placeholder="0"
                value={editingSkill.durationInCombat}
                onChange={(e) => {
                  if (!e.target.value || /^\d+$/.test(e.target.value))
                    updateEditingSkill("durationInCombat", e.target.value);
                }}
              />
            </div>
            <div className="form-field">
              <label>КД в бою:</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={editingSkill.inCombatCooldown}
                onChange={(e) => {
                  if (!e.target.value || /^\d+$/.test(e.target.value))
                    updateEditingSkill("inCombatCooldown", e.target.value);
                }}
              />
            </div>
            <div className="form-field full-width">
              <label>Длительность вне боя:</label>
              <div className="time-parts-grid">
                <div className="time-part-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={durationOutOfCombatParts.days}
                    onChange={(e) =>
                      setDurationOutOfCombatParts((prev) => ({
                        ...prev,
                        days:
                          !e.target.value || /^\d+$/.test(e.target.value)
                            ? e.target.value
                            : prev.days,
                      }))
                    }
                    placeholder="0"
                  />
                  <span>дней</span>
                </div>
                <div className="time-part-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={durationOutOfCombatParts.hours}
                    onChange={(e) =>
                      setDurationOutOfCombatParts((prev) => ({
                        ...prev,
                        hours:
                          !e.target.value || /^\d+$/.test(e.target.value)
                            ? e.target.value
                            : prev.hours,
                      }))
                    }
                    placeholder="0"
                  />
                  <span>часов</span>
                </div>
                <div className="time-part-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={durationOutOfCombatParts.minutes}
                    onChange={(e) =>
                      setDurationOutOfCombatParts((prev) => ({
                        ...prev,
                        minutes:
                          !e.target.value || /^\d+$/.test(e.target.value)
                            ? e.target.value
                            : prev.minutes,
                      }))
                    }
                    placeholder="0"
                  />
                  <span>минут</span>
                </div>
              </div>
            </div>
            <div className="form-field full-width">
              <label>КД вне боя:</label>
              <div className="time-parts-grid">
                <div className="time-part-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={outCombatParts.days}
                    onChange={(e) =>
                      updateOutCombatPart("days", e.target.value)
                    }
                    placeholder="0"
                  />
                  <span>дней</span>
                </div>
                <div className="time-part-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={outCombatParts.hours}
                    onChange={(e) =>
                      updateOutCombatPart("hours", e.target.value)
                    }
                    placeholder="0"
                  />
                  <span>часов</span>
                </div>
                <div className="time-part-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={outCombatParts.minutes}
                    onChange={(e) =>
                      updateOutCombatPart("minutes", e.target.value)
                    }
                    placeholder="0"
                  />
                  <span>минут</span>
                </div>
              </div>
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
