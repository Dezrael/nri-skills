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
        <button className="modal-close" onClick={onClose}>
          <span className="material-symbols-rounded" aria-hidden="true">
            close
          </span>
        </button>

        <div className="modal-header">
          <h2 className="modal-title">{skill.name}</h2>
          <div className="modal-badges">
            {skill.concentration && (
              <span
                className="badge concentration-badge"
                title="Требует концентрации"
              >
                <span
                  className="material-symbols-rounded badge-icon"
                  aria-hidden="true"
                >
                  blur_on
                </span>
              </span>
            )}
            <span className="badge action-type">{skill.actionType}</span>
          </div>
        </div>

        <div className="modal-info">
          <div className="info-group">
            <span className="info-label">Краткое описание:</span>
            <p className="info-value">{skill.shortDescription}</p>
          </div>

          <div className="modal-stats">
            <div className="stat-item">
              <span className="label">Дальность:</span>
              <span className="value">{skill.range}</span>
            </div>
            <div className="stat-item">
              <span className="label">Характеристика:</span>
              <span className="value">{skill.stat}</span>
            </div>
            <div className="stat-item">
              <span className="label">Длительность:</span>
              <span className="value">{skill.duration}</span>
            </div>
            {skill.damage !== "0" && (
              <div className="stat-item">
                <span className="label">Урон:</span>
                <span className="value">{skill.damage}</span>
              </div>
            )}
            <div className="stat-item">
              <span className="label">В бою (ходов):</span>
              <span className="value">{skill.inCombatCooldown}</span>
            </div>
            <div className="stat-item">
              <span className="label">Вне боя:</span>
              <span className="value">{skill.outCombatCooldown}</span>
            </div>
            <div className="stat-item">
              <span className="label">Использования:</span>
              <span className="value">{skill.outCombatCharges}</span>
            </div>
          </div>

          <div className="info-group">
            <span className="info-label">Полное описание:</span>
            <p className="full-description">{skill.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillModal;
