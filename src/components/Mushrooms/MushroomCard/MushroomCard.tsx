import React from "react";
import { Mushroom } from "../../../types/PlayerSkill";
import "./MushroomCard.css";

interface MushroomCardProps {
  mushroom: Mushroom;
  isPinned?: boolean;
  onTogglePin?: (mushroomId: number | undefined) => void;
}

const MushroomCard: React.FC<MushroomCardProps> = ({
  mushroom,
  isPinned,
  onTogglePin,
}) => {
  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(mushroom.id);
  };

  return (
    <div className="mushroom-card">
      <div className="mushroom-header">
        <h3 className="mushroom-name">{mushroom.name}</h3>
        <button
          className={`pin-btn ${isPinned ? "pinned" : ""}`}
          onClick={handleTogglePin}
          title={isPinned ? "Открепить гриб" : "Закрепить гриб"}
          aria-label={isPinned ? "Открепить" : "Закрепить"}
        >
          <span
            className="material-symbols-rounded pin-icon"
            aria-hidden="true"
          >
            {isPinned ? "lock" : "lock_open"}
          </span>
        </button>
      </div>
      <div className="mushroom-content">
        <div className="mushroom-section">
          <h4>Базовый эффект:</h4>
          <p>{mushroom.baseEffect}</p>
        </div>
        {mushroom.activationEffect && (
          <div className="mushroom-section">
            <h4>Эффект активации:</h4>
            <p>{mushroom.activationEffect}</p>
          </div>
        )}
        {mushroom.summonEffect && (
          <div className="mushroom-section">
            <h4>Эффект призыва:</h4>
            <p>{mushroom.summonEffect}</p>
          </div>
        )}
        {mushroom.aspectEffect && (
          <div className="mushroom-section">
            <h4>Эффект аспекта:</h4>
            <p>{mushroom.aspectEffect}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MushroomCard;
