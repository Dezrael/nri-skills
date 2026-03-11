import React from "react";
import { PassiveAbility } from "../../../types/PlayerSkill";
import "./PassiveCard.css";

interface PassiveCardProps {
  passive: PassiveAbility;
  isPinned?: boolean;
  onTogglePin?: (passiveId: number | undefined) => void;
}

const PassiveCard: React.FC<PassiveCardProps> = ({
  passive,
  isPinned,
  onTogglePin,
}) => {
  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(passive.id);
  };

  return (
    <div className="passive-card">
      <div className="passive-header">
        <h3 className="passive-name">{passive.name}</h3>
        <button
          className={`pin-btn ${isPinned ? "pinned" : ""}`}
          onClick={handleTogglePin}
          title={isPinned ? "Открепить способность" : "Закрепить способность"}
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
      <p className="passive-text">{passive.text}</p>
    </div>
  );
};

export default PassiveCard;
