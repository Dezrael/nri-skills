import React, { useState } from "react";
import { Mushroom } from "../../../types/PlayerSkill";
import {
  createMushroom,
  deleteMushroom,
  isUnauthorizedError,
  updateMushroom,
} from "../../../api/nriApi";
import "./MushroomsTable.css";

interface MushroomsTableProps {
  authToken: string;
  onAuthExpired: () => void;
  onNotify: (type: "success" | "error" | "info", message: string) => void;
  className: string;
  mushrooms: Mushroom[];
  onUpdate: (mushrooms: Mushroom[]) => void;
}

function MushroomsTable({
  authToken,
  onAuthExpired,
  onNotify,
  className,
  mushrooms,
  onUpdate,
}: MushroomsTableProps) {
  const [editingMushroom, setEditingMushroom] = useState<Mushroom | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    const newMushroom: Mushroom = {
      name: "",
      baseEffect: "",
      activationEffect: "",
      summonEffect: "",
      aspectEffect: "",
    };
    setEditingMushroom(newMushroom);
    setIsAdding(true);
  };

  const handleEdit = (mushroom: Mushroom) => {
    setEditingMushroom({ ...mushroom });
    setIsAdding(false);
  };

  const handleDelete = async (index: number) => {
    if (window.confirm("Вы уверены, что хотите удалить этот гриб?")) {
      const mushroomToDelete = mushrooms[index];
      try {
        if (mushroomToDelete?.id) {
          await deleteMushroom(mushroomToDelete.id, authToken);
        }
        const updatedMushrooms = mushrooms.filter((_, i) => i !== index);
        onUpdate(updatedMushrooms);
        onNotify("success", "Гриб удален");
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
    if (!editingMushroom) return;

    try {
      if (isAdding) {
        const created = await createMushroom(
          {
            ...editingMushroom,
            className,
          },
          authToken,
        );
        onUpdate([...mushrooms, created]);
        onNotify("success", "Гриб создан");
      } else {
        if (!editingMushroom.id) {
          throw new Error("У гриба отсутствует ID");
        }
        const updatedFromApi = await updateMushroom(
          editingMushroom.id,
          {
            ...editingMushroom,
            className,
          },
          authToken,
        );
        const index = mushrooms.findIndex((m) => m.id === editingMushroom.id);
        if (index !== -1) {
          const updatedMushrooms = [...mushrooms];
          updatedMushrooms[index] = updatedFromApi;
          onUpdate(updatedMushrooms);
          onNotify("success", "Гриб обновлен");
        }
      }

      setEditingMushroom(null);
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
    setEditingMushroom(null);
    setIsAdding(false);
  };

  const updateEditingMushroom = (field: keyof Mushroom, value: string) => {
    if (!editingMushroom) return;
    setEditingMushroom({ ...editingMushroom, [field]: value });
  };

  return (
    <div className="mushrooms-table-container">
      <div className="table-header">
        <h3>Грибы класса: {className}</h3>
        <button onClick={handleAdd} className="add-btn">
          <span
            className="material-symbols-rounded table-btn-icon"
            aria-hidden="true"
          >
            add
          </span>
          Добавить гриб
        </button>
      </div>

      {editingMushroom && (
        <div className="edit-form">
          <h4>{isAdding ? "Добавление гриба" : "Редактирование гриба"}</h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Название:</label>
              <input
                type="text"
                value={editingMushroom.name}
                onChange={(e) => updateEditingMushroom("name", e.target.value)}
              />
            </div>
            <div className="form-field full-width">
              <label>Базовый эффект:</label>
              <textarea
                value={editingMushroom.baseEffect}
                onChange={(e) =>
                  updateEditingMushroom("baseEffect", e.target.value)
                }
                rows={2}
              />
            </div>
            <div className="form-field full-width">
              <label>Эффект активации:</label>
              <textarea
                value={editingMushroom.activationEffect}
                onChange={(e) =>
                  updateEditingMushroom("activationEffect", e.target.value)
                }
                rows={2}
              />
            </div>
            <div className="form-field full-width">
              <label>Эффект призыва:</label>
              <textarea
                value={editingMushroom.summonEffect}
                onChange={(e) =>
                  updateEditingMushroom("summonEffect", e.target.value)
                }
                rows={2}
              />
            </div>
            <div className="form-field full-width">
              <label>Эффект аспекта:</label>
              <textarea
                value={editingMushroom.aspectEffect}
                onChange={(e) =>
                  updateEditingMushroom("aspectEffect", e.target.value)
                }
                rows={2}
              />
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
        <table className="mushrooms-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Базовый эффект</th>
              <th>Эффект активации</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {mushrooms.map((mushroom, index) => (
              <tr key={index}>
                <td>{mushroom.name}</td>
                <td>
                  {mushroom.baseEffect.length > 50
                    ? `${mushroom.baseEffect.substring(0, 50)}...`
                    : mushroom.baseEffect}
                </td>
                <td>
                  {mushroom.activationEffect.length > 50
                    ? `${mushroom.activationEffect.substring(0, 50)}...`
                    : mushroom.activationEffect}
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(mushroom)}
                    className="edit-btn"
                  >
                    <span
                      className="material-symbols-rounded action-icon"
                      aria-hidden="true"
                    >
                      edit
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

export default MushroomsTable;
