import React from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import "./SkillCard.css";

interface SkillCardProps {
  skill: PlayerSkill;
  onSelectSkill: (skill: PlayerSkill) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onSelectSkill }) => {
  return (
    <div
      className={`skill-card ${skill.concentration ? "concentration" : ""}`}
      onClick={() => onSelectSkill(skill)}
    >
      <div className="skill-header">
        <h3 className="skill-name">{skill.name}</h3>
        <div className="skill-badges">
          {skill.concentration && (
            <span
              className="badge concentration-badge"
              title="Требует концентрации"
            >
              ⓒ
            </span>
          )}
          <span className="badge action-type">{skill.actionType}</span>
        </div>
      </div>

      <p className="short-description">{skill.shortDescription}</p>

      <div className="skill-stats">
        <div className="stat">
          <span className="label">Дальность:</span>
          <span className="value">{skill.range}</span>
        </div>
        <div className="stat">
          <span className="label">Характеристика:</span>
          <span className="value">{skill.stat}</span>
        </div>
        <div className="stat">
          <span className="label">Длительность:</span>
          <span className="value">{skill.duration}</span>
        </div>
        {skill.damage !== "0" && (
          <div className="stat">
            <span className="label">Урон:</span>
            <span className="value">{skill.damage}</span>
          </div>
        )}
      </div>

      <div className="skill-cooldowns">
        <div className="cooldown">
          <span className="label">В бою (ходов):</span>
          <span className="value">{skill.inCombatCooldown}</span>
        </div>
        <div className="cooldown">
          <span className="label">Вне боя:</span>
          <span className="value">{skill.outCombatCooldown}</span>
        </div>
        <div className="cooldown">
          <span className="label">Использования:</span>
          <span className="value">{skill.outCombatCharges}</span>
        </div>
      </div>

      <p className="full-description" style={{ display: "none" }}>
        {skill.description}
      </p>
    </div>
  );
};

export default SkillCard;
