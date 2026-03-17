import React, { useEffect } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import "./SkillModal.css";

interface SkillModalProps {
  skill: PlayerSkill | null;
  isOpen: boolean;
  onClose: () => void;
}

const SkillModal: React.FC<SkillModalProps> = ({ skill, isOpen, onClose }) => {
  const isVisible = isOpen && !!skill;

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isVisible]);

  if (!isVisible || !skill) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{skill.name}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <span className="material-symbols-rounded" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="modal-badges">
          {skill.concentration && (
            <span className="badge concentration-badge">
              <span
                className="material-symbols-rounded badge-icon"
                aria-hidden="true"
              >
                blur_on
              </span>{" "}
              Концентрация
            </span>
          )}
          {skill.actionType && skill.actionType !== "-" && (
            <span className="badge">{skill.actionType}</span>
          )}
          {skill.category && skill.category.trim() && (
            <span className="badge">{skill.category}</span>
          )}
        </div>

        <div className="modal-info">
          {skill.shortDescription && (
            <div className="info-group">
              <span className="info-label">Краткое описание</span>
              <p className="info-value">{skill.shortDescription}</p>
            </div>
          )}

          <div className="modal-stats">
            <div className="stat-item">
              <span className="label">Дальность</span>
              <span className="value">{skill.range}</span>
            </div>
            <div className="stat-item">
              <span className="label">Характеристика</span>
              <span className="value">{skill.stat}</span>
            </div>
            <div className="stat-item">
              <span className="label">Длит. в бою</span>
              <span className="value">{skill.durationInCombat}</span>
            </div>
            <div className="stat-item">
              <span className="label">Длит. вне боя</span>
              <span className="value">{skill.durationOutOfCombat}</span>
            </div>
            <div className="stat-item">
              <span className="label">КД в бою</span>
              <span className="value">{skill.inCombatCooldown}</span>
            </div>
            <div className="stat-item">
              <span className="label">КД вне боя</span>
              <span className="value">{skill.outCombatCooldown}</span>
            </div>
            <div className="stat-item">
              <span className="label">Использования</span>
              <span className="value">{skill.outCombatCharges}</span>
            </div>
            {skill.cooldownType && skill.cooldownType !== "-" && (
              <div className="stat-item">
                <span className="label">Тип перезарядки</span>
                <span className="value">{skill.cooldownType}</span>
              </div>
            )}
            {skill.damage !== "0" && (
              <div className="stat-item">
                <span className="label">Урон/исцеление</span>
                <span className="value">{skill.damage}</span>
              </div>
            )}
            {skill.savingThrow && skill.savingThrow !== "-" && (
              <div className="stat-item">
                <span className="label">Спасбросок</span>
                <span className="value">{skill.savingThrow}</span>
              </div>
            )}
          </div>

          <div className="info-group">
            <span className="info-label">Описание</span>
            <p className="full-description">{skill.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillModal;
