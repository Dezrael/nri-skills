import React, { useState, useEffect } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import {
  clearSkillCooldownField,
  consumeSkillCharge,
  getCooldown,
  getSkillCharges,
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
  isPinned?: boolean;
  onTogglePin?: (skillId: number | undefined) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  className,
  onSelectSkill,
  onCooldownChange,
  isPinned,
  onTogglePin,
}) => {
  const [cooldown, setCooldown] = useState(getCooldown(className, skill.name));
  const [charges, setCharges] = useState(
    getSkillCharges(className, skill.name, skill.outCombatCharges),
  );

  useEffect(() => {
    setCooldown(getCooldown(className, skill.name));
    setCharges(getSkillCharges(className, skill.name, skill.outCombatCharges));
  }, [className, skill.name, skill.outCombatCharges]);

  const handleUseInCombat = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();

    if (charges && charges.current <= 0) {
      return;
    }

    const nextCharges = consumeSkillCharge(
      className,
      skill.name,
      skill.outCombatCharges,
    );

    if (nextCharges) {
      setCharges(nextCharges);
    }

    playerUseSkillInCombat(
      className,
      skill.name,
      skill.inCombatCooldown,
      skill.outCombatCooldown,
      skill.durationInCombat,
      skill.durationOutOfCombat,
    );
    setCooldown(getCooldown(className, skill.name));
    onCooldownChange?.();
  };

  const handleUseOutOfCombat = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();

    if (charges && charges.current <= 0) {
      return;
    }

    const nextCharges = consumeSkillCharge(
      className,
      skill.name,
      skill.outCombatCharges,
    );

    if (nextCharges) {
      setCharges(nextCharges);
    }

    playerUseSkillOutOfCombat(
      className,
      skill.name,
      skill.inCombatCooldown,
      skill.outCombatCooldown,
      skill.durationInCombat,
      skill.durationOutOfCombat,
    );
    setCooldown(getCooldown(className, skill.name));
    onCooldownChange?.();
  };

  const handleTogglePin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();
    onTogglePin?.(skill.id);
  };

  const handleClearCooldownField =
    (
      field:
        | "inCombatTurns"
        | "outCombatMinutes"
        | "durationInCombatTurns"
        | "durationOutCombatMinutes",
    ) =>
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.currentTarget.blur();
      clearSkillCooldownField(className, skill.name, field);
      setCooldown(getCooldown(className, skill.name));
      onCooldownChange?.();
    };

  const isOnCooldown =
    !!cooldown && (cooldown.inCombatTurns > 0 || cooldown.outCombatMinutes > 0);
  const hasActiveDuration =
    !!cooldown &&
    (cooldown.durationInCombatTurns > 0 ||
      cooldown.durationOutCombatMinutes > 0);
  const combatCooldownActive = cooldown && cooldown.inCombatTurns > 0;
  const outCombatCooldownActive = cooldown && cooldown.outCombatMinutes > 0;
  const combatDurationActive = cooldown && cooldown.durationInCombatTurns > 0;
  const outCombatDurationActive =
    cooldown && cooldown.durationOutCombatMinutes > 0;
  const hasChargeLimit = (Number(skill.outCombatCharges) || 0) > 0;
  const hasChargesAvailable = !charges || charges.current > 0;
  const chargesDisplay = charges
    ? `${charges.current}/${charges.max}`
    : skill.outCombatCharges;
  const cooldownTypeDisplay = skill.cooldownType?.trim().toLowerCase();

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
          {skill.actionType && skill.actionType !== "-" && (
            <span className="badge action-type">{skill.actionType}</span>
          )}
        </div>
        <button
          type="button"
          className={`pin-btn ${isPinned ? "pinned" : ""}`}
          onClick={handleTogglePin}
          title={isPinned ? "Открепить заклинание" : "Закрепить заклинание"}
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
          <span className="label">Длит. в бою:</span>
          <span className="value">{skill.durationInCombat}</span>
        </div>
        <div className="stat">
          <span className="label">Длит. вне боя:</span>
          <span className="value">{skill.durationOutOfCombat}</span>
        </div>
        {skill.damage !== "0" && (
          <div className="stat">
            <span className="label">Урон:</span>
            <span className="value">{skill.damage}</span>
          </div>
        )}
        {skill.savingThrow && skill.savingThrow !== "-" && (
          <div className="stat">
            <span className="label">Спасбросок:</span>
            <span className="value">{skill.savingThrow}</span>
          </div>
        )}
      </div>

      <div className="skill-cooldowns">
        <div className="cooldown">
          <span className="label">КД в бою (х.):</span>
          <span className="value">{skill.inCombatCooldown}</span>
        </div>
        <div className="cooldown">
          <span className="label">КД вне боя:</span>
          <span className="value">{skill.outCombatCooldown}</span>
        </div>
        <div className="cooldown">
          <span className="label">Использования:</span>
          <span className={`value ${hasChargeLimit ? "charges-value" : ""}`}>
            <span>{chargesDisplay}</span>
            {hasChargeLimit && cooldownTypeDisplay && (
              <span className="charge-reset-type">{cooldownTypeDisplay}</span>
            )}
          </span>
        </div>
      </div>

      <p className="full-description" style={{ display: "none" }}>
        {skill.description}
      </p>

      <div className="skill-footer">
        {(hasActiveDuration || isOnCooldown) && (
          <div className="active-cooldown">
            {combatDurationActive && (
              <div className="cooldown-badge duration combat">
                <span className="cooldown-badge-content">
                  <span
                    className="material-symbols-rounded inline-icon"
                    aria-hidden="true"
                  >
                    timer
                  </span>{" "}
                  Длительность: {cooldown!.durationInCombatTurns}{" "}
                  {cooldown!.durationInCombatTurns === 1
                    ? "ход"
                    : cooldown!.durationInCombatTurns < 5
                      ? "хода"
                      : "ходов"}
                </span>
                <button
                  type="button"
                  className="cooldown-clear-btn"
                  aria-label="Сбросить длительность в бою"
                  title="Сбросить"
                  onClick={handleClearCooldownField("durationInCombatTurns")}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>
            )}
            {outCombatDurationActive && (
              <div className="cooldown-badge duration out-combat">
                <span className="cooldown-badge-content">
                  <span
                    className="material-symbols-rounded inline-icon"
                    aria-hidden="true"
                  >
                    timer
                  </span>{" "}
                  Длительность:{" "}
                  {minutesToTimeString(cooldown!.durationOutCombatMinutes)}
                </span>
                <button
                  type="button"
                  className="cooldown-clear-btn"
                  aria-label="Сбросить длительность вне боя"
                  title="Сбросить"
                  onClick={handleClearCooldownField("durationOutCombatMinutes")}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>
            )}
            {combatCooldownActive && (
              <div className="cooldown-badge combat">
                <span className="cooldown-badge-content">
                  <span
                    className="material-symbols-rounded inline-icon"
                    aria-hidden="true"
                  >
                    schedule
                  </span>{" "}
                  Перезарядка: {cooldown!.inCombatTurns}{" "}
                  {cooldown!.inCombatTurns === 1
                    ? "ход"
                    : cooldown!.inCombatTurns < 5
                      ? "хода"
                      : "ходов"}
                </span>
                <button
                  type="button"
                  className="cooldown-clear-btn"
                  aria-label="Сбросить перезарядку в бою"
                  title="Сбросить"
                  onClick={handleClearCooldownField("inCombatTurns")}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>
            )}
            {outCombatCooldownActive && (
              <div className="cooldown-badge out-combat">
                <span className="cooldown-badge-content">
                  <span
                    className="material-symbols-rounded inline-icon"
                    aria-hidden="true"
                  >
                    schedule
                  </span>{" "}
                  Перезарядка: {minutesToTimeString(cooldown!.outCombatMinutes)}
                </span>
                <button
                  type="button"
                  className="cooldown-clear-btn"
                  aria-label="Сбросить перезарядку вне боя"
                  title="Сбросить"
                  onClick={handleClearCooldownField("outCombatMinutes")}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="skill-actions">
          <button
            type="button"
            className="use-skill-btn combat"
            onClick={handleUseInCombat}
            disabled={isOnCooldown || !hasChargesAvailable}
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
            type="button"
            className="use-skill-btn out-combat"
            onClick={handleUseOutOfCombat}
            disabled={isOnCooldown || !hasChargesAvailable}
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
    </div>
  );
};

export default SkillCard;
