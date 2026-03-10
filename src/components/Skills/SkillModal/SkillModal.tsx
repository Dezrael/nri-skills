import React from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import "./SkillModal.css";

interface SkillModalProps {
  skill: PlayerSkill | null;
  isOpen: boolean;
  onClose: () => void;
}

const SkillModal: React.FC<SkillModalProps> = ({ skill, isOpen, onClose }) => {
  if (!isOpen || !skill) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{skill.name}</h2>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-rounded" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="modal-info">
          <div className="info-group">
            <p className="full-description">{skill.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillModal;
