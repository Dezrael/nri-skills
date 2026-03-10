import React, { useState, useEffect } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import {
  getCooldown,
  playerUseSkillInCombat,
  playerUseSkillOutOfCombat,
  minutesToTimeString,
} from "../../../utils/cooldownManager";
import "./SkillCard.css";

interface SkillCardProps {
  skill: PlayerSkill;
  className: string;
  onSelectSkill: (skill: PlayerSkill) => void;
  onCooldownChange?: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  className,
  onSelectSkill,
  onCooldownChange,
}) => {
  const [cooldown, setCooldown] = useState(getCooldown(className, skill.name));

  useEffect(() => {
    setCooldown(getCooldown(className, skill.name));
  }, [className, skill.name]);

  const handleUseInCombat = (e: React.MouseEvent) => {
    e.stopPropagation();
    playerUseSkillInCombat(className, skill.name, skill.inCombatCooldown);
    setCooldown(getCooldown(className, skill.name));
    onCooldownChange?.();
  };

  const handleUseOutOfCombat = (e: React.MouseEvent) => {
    e.stopPropagation();
    playerUseSkillOutOfCombat(className, skill.name, skill.outCombatCooldown);
    setCooldown(getCooldown(className, skill.name));
    onCooldownChange?.();
  };

  const isOnCooldown =
    !!cooldown && (cooldown.inCombatTurns > 0 || cooldown.outCombatMinutes > 0);
  const combatCooldownActive = cooldown && cooldown.inCombatTurns > 0;
  const outCombatCooldownActive = cooldown && cooldown.outCombatMinutes > 0;
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

      {isOnCooldown && (
        <div className="active-cooldown">
          {combatCooldownActive && (
            <div className="cooldown-badge combat">
              <span
                className="material-symbols-rounded inline-icon"
                aria-hidden="true"
              >
                swords
              </span>{" "}
              Перезарядка: {cooldown!.inCombatTurns}{" "}
              {cooldown!.inCombatTurns === 1
                ? "ход"
                : cooldown!.inCombatTurns < 5
                  ? "хода"
                  : "ходов"}
            </div>
          )}
          {outCombatCooldownActive && (
            <div className="cooldown-badge out-combat">
              <span
                className="material-symbols-rounded inline-icon"
                aria-hidden="true"
              >
                schedule
              </span>{" "}
              Перезарядка: {minutesToTimeString(cooldown!.outCombatMinutes)}
            </div>
          )}
        </div>
      )}

      <div className="skill-actions">
        <button
          className="use-skill-btn combat"
          onClick={handleUseInCombat}
          disabled={skill.inCombatCooldown === "0" || isOnCooldown}
        >
          <span
            className="material-symbols-rounded btn-icon"
            aria-hidden="true"
          >
            swords
          </span>
          Использовать в бою
        </button>
        <button
          className="use-skill-btn out-combat"
          onClick={handleUseOutOfCombat}
          disabled={
            skill.outCombatCooldown === "-" ||
            skill.outCombatCooldown === "∞" ||
            isOnCooldown
          }
        >
          <span
            className="material-symbols-rounded btn-icon"
            aria-hidden="true"
          >
            camping
          </span>
          Использовать вне боя
        </button>
      </div>
    </div>
  );
};

export default SkillCard;
