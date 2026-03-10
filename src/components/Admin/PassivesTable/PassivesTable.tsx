import React, { useState } from "react";
import { PassiveAbility } from "../../../types/PlayerSkill";
import {
  createPassive,
  deletePassive,
  isUnauthorizedError,
  updatePassive,
} from "../../../api/nriApi";
import "./PassivesTable.css";

interface PassivesTableProps {
  authToken: string;
  onAuthExpired: () => void;
  className: string;
  passives: PassiveAbility[];
  onUpdate: (passives: PassiveAbility[]) => void;
}

function PassivesTable({
  authToken,
  onAuthExpired,
  className,
  passives,
  onUpdate,
}: PassivesTableProps) {
  const [editingPassive, setEditingPassive] = useState<PassiveAbility | null>(
    null,
  );
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    const newPassive: PassiveAbility = {
      name: "",
      text: "",
    };
    setEditingPassive(newPassive);
    setIsAdding(true);
  };

  const handleEdit = (passive: PassiveAbility) => {
    setEditingPassive({ ...passive });
    setIsAdding(false);
  };

  const handleDelete = async (index: number) => {
    if (
      window.confirm(
        "Вы уверены, что хотите удалить эту пассивную способность?",
      )
    ) {
      const passiveToDelete = passives[index];
      try {
        if (passiveToDelete?.id) {
          await deletePassive(passiveToDelete.id, authToken);
        }
        const updatedPassives = passives.filter((_, i) => i !== index);
        onUpdate(updatedPassives);
      } catch (err) {
        if (isUnauthorizedError(err)) {
          onAuthExpired();
          return;
        }
        alert(
          err instanceof Error
            ? `Ошибка удаления: ${err.message}`
            : "Ошибка удаления",
        );
      }
    }
  };

  const handleSave = async () => {
    if (!editingPassive) return;

    try {
      if (isAdding) {
        const created = await createPassive(
          {
            ...editingPassive,
            className,
          },
          authToken,
        );
        onUpdate([...passives, created]);
      } else {
        if (!editingPassive.id) {
          throw new Error("У пассивки отсутствует ID");
        }
        const updatedFromApi = await updatePassive(
          editingPassive.id,
          {
            ...editingPassive,
            className,
          },
          authToken,
        );
        const index = passives.findIndex((p) => p.id === editingPassive.id);
        if (index !== -1) {
          const updatedPassives = [...passives];
          updatedPassives[index] = updatedFromApi;
          onUpdate(updatedPassives);
        }
      }

      setEditingPassive(null);
      setIsAdding(false);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        onAuthExpired();
        return;
      }
      alert(
        err instanceof Error
          ? `Ошибка сохранения: ${err.message}`
          : "Ошибка сохранения",
      );
    }
  };

  const handleCancel = () => {
    setEditingPassive(null);
    setIsAdding(false);
  };

  const updateEditingPassive = (field: keyof PassiveAbility, value: string) => {
    if (!editingPassive) return;
    setEditingPassive({ ...editingPassive, [field]: value });
  };

  return (
    <div className="passives-table-container">
      <div className="table-header">
        <h3>Пассивные способности класса: {className}</h3>
        <button onClick={handleAdd} className="add-btn">
          ➕ Добавить пассивку
        </button>
      </div>

      {editingPassive && (
        <div className="edit-form">
          <h4>
            {isAdding
              ? "Добавление пассивной способности"
              : "Редактирование пассивной способности"}
          </h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Название:</label>
              <input
                type="text"
                value={editingPassive.name}
                onChange={(e) => updateEditingPassive("name", e.target.value)}
              />
            </div>
            <div className="form-field full-width">
              <label>Описание:</label>
              <textarea
                value={editingPassive.text}
                onChange={(e) => updateEditingPassive("text", e.target.value)}
                rows={4}
              />
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
        <table className="passives-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Описание</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {passives.map((passive, index) => (
              <tr key={index}>
                <td>{passive.name}</td>
                <td>
                  {passive.text.length > 100
                    ? `${passive.text.substring(0, 100)}...`
                    : passive.text}
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(passive)}
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

export default PassivesTable;
