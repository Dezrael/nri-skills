import React, { useState, useEffect } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import {
  clearSkillCooldownField,
  setSkillCooldownField,
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
  onActionFeedback?: (message: string) => void;
  isPinned?: boolean;
  onTogglePin?: (skillId: number | undefined) => void;
  cooldownVersion?: number;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  className,
  onSelectSkill,
  onCooldownChange,
  onActionFeedback,
  isPinned,
  onTogglePin,
  cooldownVersion,
}) => {
  const [cooldown, setCooldown] = useState(getCooldown(className, skill.name));
  const [charges, setCharges] = useState(
    getSkillCharges(className, skill.name, skill.outCombatCharges),
  );

  type EditField =
    | "inCombatTurns"
    | "outCombatMinutes"
    | "durationInCombatTurns"
    | "durationOutCombatMinutes";

  const [editField, setEditField] = useState<EditField | null>(null);
  const [editTurns, setEditTurns] = useState(0);
  const [editDays, setEditDays] = useState(0);
  const [editHours, setEditHours] = useState(0);
  const [editMins, setEditMins] = useState(0);

  useEffect(() => {
    setCooldown(getCooldown(className, skill.name));
    setCharges(getSkillCharges(className, skill.name, skill.outCombatCharges));
  }, [className, skill.name, skill.outCombatCharges, cooldownVersion]);

  useEffect(() => {
    if (!editField) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editField]);

  const openEditModal = (field: EditField) => {
    const cd = getCooldown(className, skill.name);
    setEditField(field);
    if (field === "inCombatTurns") {
      setEditTurns(cd?.inCombatTurns ?? 0);
    } else if (field === "durationInCombatTurns") {
      setEditTurns(cd?.durationInCombatTurns ?? 0);
    } else {
      const mins =
        field === "outCombatMinutes"
          ? (cd?.outCombatMinutes ?? 0)
          : (cd?.durationOutCombatMinutes ?? 0);
      setEditDays(Math.floor(mins / (24 * 60)));
      setEditHours(Math.floor((mins % (24 * 60)) / 60));
      setEditMins(mins % 60);
    }
  };

  const handleApplyEdit = () => {
    if (!editField) return;
    const isTurns =
      editField === "inCombatTurns" || editField === "durationInCombatTurns";
    const value = isTurns
      ? Math.max(0, editTurns)
      : editDays * 24 * 60 + editHours * 60 + editMins;
    setSkillCooldownField(className, skill.name, editField, value);
    setCooldown(getCooldown(className, skill.name));
    setEditField(null);
  };

  const EDIT_FIELD_LABELS: Record<EditField, string> = {
    inCombatTurns: "Перезарядка в бою",
    durationInCombatTurns: "Длительность в бою",
    outCombatMinutes: "Перезарядка вне боя",
    durationOutCombatMinutes: "Длительность вне боя",
  };

  const pluralizeTurns = (n: number) =>
    n === 1 ? "ход" : n >= 2 && n <= 4 ? "хода" : "ходов";

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
    onActionFeedback?.(`Использовано: ${skill.name}`);
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
    onActionFeedback?.(`Использовано: ${skill.name}`);
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
      onActionFeedback?.(
        field === "inCombatTurns" || field === "outCombatMinutes"
          ? "Перезарядка сброшена"
          : "Длительность сброшена",
      );
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
    <>
      <div
        className={`skill-card ${skill.concentration ? "concentration" : ""}`}
        onClick={() => onSelectSkill(skill)}
      >
        <div className="skill-header">
          <div className="skill-header-top">
            <h3 className="skill-name">{skill.name}</h3>
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
              <span className="label">Урон/исцеление:</span>
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
                  <button
                    type="button"
                    className="cooldown-badge-content cooldown-badge-btn"
                    aria-label="Изменить длительность в бою"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal("durationInCombatTurns");
                    }}
                  >
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
                  </button>
                  <button
                    type="button"
                    className="cooldown-clear-btn"
                    aria-label="Сбросить длительность в бою"
                    title="Сбросить"
                    onClick={handleClearCooldownField("durationInCombatTurns")}
                  >
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      close
                    </span>
                  </button>
                </div>
              )}
              {outCombatDurationActive && (
                <div className="cooldown-badge duration out-combat">
                  <button
                    type="button"
                    className="cooldown-badge-content cooldown-badge-btn"
                    aria-label="Изменить длительность вне боя"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal("durationOutCombatMinutes");
                    }}
                  >
                    <span
                      className="material-symbols-rounded inline-icon"
                      aria-hidden="true"
                    >
                      timer
                    </span>{" "}
                    Длительность:{" "}
                    {minutesToTimeString(cooldown!.durationOutCombatMinutes)}
                  </button>
                  <button
                    type="button"
                    className="cooldown-clear-btn"
                    aria-label="Сбросить длительность вне боя"
                    title="Сбросить"
                    onClick={handleClearCooldownField(
                      "durationOutCombatMinutes",
                    )}
                  >
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      close
                    </span>
                  </button>
                </div>
              )}
              {combatCooldownActive && (
                <div className="cooldown-badge combat">
                  <button
                    type="button"
                    className="cooldown-badge-content cooldown-badge-btn"
                    aria-label="Изменить перезарядку в бою"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal("inCombatTurns");
                    }}
                  >
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
                  </button>
                  <button
                    type="button"
                    className="cooldown-clear-btn"
                    aria-label="Сбросить перезарядку в бою"
                    title="Сбросить"
                    onClick={handleClearCooldownField("inCombatTurns")}
                  >
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      close
                    </span>
                  </button>
                </div>
              )}
              {outCombatCooldownActive && (
                <div className="cooldown-badge out-combat">
                  <button
                    type="button"
                    className="cooldown-badge-content cooldown-badge-btn"
                    aria-label="Изменить перезарядку вне боя"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal("outCombatMinutes");
                    }}
                  >
                    <span
                      className="material-symbols-rounded inline-icon"
                      aria-hidden="true"
                    >
                      schedule
                    </span>{" "}
                    Перезарядка:{" "}
                    {minutesToTimeString(cooldown!.outCombatMinutes)}
                  </button>
                  <button
                    type="button"
                    className="cooldown-clear-btn"
                    aria-label="Сбросить перезарядку вне боя"
                    title="Сбросить"
                    onClick={handleClearCooldownField("outCombatMinutes")}
                  >
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
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

      {editField && (
        <CooldownEditModal
          field={editField}
          label={EDIT_FIELD_LABELS[editField]}
          editTurns={editTurns}
          setEditTurns={setEditTurns}
          editDays={editDays}
          setEditDays={setEditDays}
          editHours={editHours}
          setEditHours={setEditHours}
          editMins={editMins}
          setEditMins={setEditMins}
          onSave={handleApplyEdit}
          onClose={() => setEditField(null)}
          pluralizeTurns={pluralizeTurns}
        />
      )}
    </>
  );
};

// --- Cooldown Edit Modal ---
const CooldownEditModal: React.FC<{
  field:
    | "inCombatTurns"
    | "outCombatMinutes"
    | "durationInCombatTurns"
    | "durationOutCombatMinutes";
  label: string;
  editTurns: number;
  setEditTurns: React.Dispatch<React.SetStateAction<number>>;
  editDays: number;
  setEditDays: React.Dispatch<React.SetStateAction<number>>;
  editHours: number;
  setEditHours: React.Dispatch<React.SetStateAction<number>>;
  editMins: number;
  setEditMins: React.Dispatch<React.SetStateAction<number>>;
  onSave: () => void;
  onClose: () => void;
  pluralizeTurns: (n: number) => string;
}> = ({
  field,
  label,
  editTurns,
  setEditTurns,
  editDays,
  setEditDays,
  editHours,
  setEditHours,
  editMins,
  setEditMins,
  onSave,
  onClose,
  pluralizeTurns,
}) => {
  const isTurns =
    field === "inCombatTurns" || field === "durationInCombatTurns";

  return (
    <div
      className="cd-edit-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="cd-edit-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cd-edit-header">
          <span className="cd-edit-title">{label}</span>
          <button
            type="button"
            className="cd-edit-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="cd-edit-body">
          {isTurns ? (
            <div className="cd-turns-row">
              <button
                type="button"
                className="cd-step-btn"
                onClick={() => setEditTurns((t) => Math.max(0, t - 1))}
                aria-label="Уменьшить на 1 ход"
              >
                −1
              </button>
              <input
                type="number"
                className="cd-turns-input"
                inputMode="numeric"
                min={0}
                value={editTurns}
                onChange={(e) =>
                  setEditTurns(
                    Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  )
                }
                aria-label="Количество ходов"
              />
              <button
                type="button"
                className="cd-step-btn"
                onClick={() => setEditTurns((t) => t + 1)}
                aria-label="Увеличить на 1 ход"
              >
                +1
              </button>
            </div>
          ) : (
            <div className="cd-time-grid">
              <div className="cd-time-unit">
                <button
                  type="button"
                  className="cd-step-btn"
                  onClick={() => setEditDays((d) => Math.max(0, d - 1))}
                  aria-label="День −1"
                >
                  −
                </button>
                <div className="cd-time-value">
                  <input
                    type="number"
                    className="cd-time-input"
                    inputMode="numeric"
                    min={0}
                    value={editDays}
                    onChange={(e) =>
                      setEditDays(
                        Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      )
                    }
                    aria-label="Дни"
                  />
                  <span className="cd-time-label">дн.</span>
                </div>
                <button
                  type="button"
                  className="cd-step-btn"
                  onClick={() => setEditDays((d) => d + 1)}
                  aria-label="День +1"
                >
                  +
                </button>
              </div>
              <div className="cd-time-unit">
                <button
                  type="button"
                  className="cd-step-btn"
                  onClick={() => setEditHours((h) => Math.max(0, h - 1))}
                  aria-label="Час −1"
                >
                  −
                </button>
                <div className="cd-time-value">
                  <input
                    type="number"
                    className="cd-time-input"
                    inputMode="numeric"
                    min={0}
                    value={editHours}
                    onChange={(e) =>
                      setEditHours(
                        Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      )
                    }
                    aria-label="Часы"
                  />
                  <span className="cd-time-label">ч.</span>
                </div>
                <button
                  type="button"
                  className="cd-step-btn"
                  onClick={() => setEditHours((h) => h + 1)}
                  aria-label="Час +1"
                >
                  +
                </button>
              </div>
              <div className="cd-time-unit">
                <button
                  type="button"
                  className="cd-step-btn"
                  onClick={() => setEditMins((m) => Math.max(0, m - 1))}
                  aria-label="Минута −1"
                >
                  −
                </button>
                <div className="cd-time-value">
                  <input
                    type="number"
                    className="cd-time-input"
                    inputMode="numeric"
                    min={0}
                    value={editMins}
                    onChange={(e) =>
                      setEditMins(
                        Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      )
                    }
                    aria-label="Минуты"
                  />
                  <span className="cd-time-label">мин.</span>
                </div>
                <button
                  type="button"
                  className="cd-step-btn"
                  onClick={() => setEditMins((m) => m + 1)}
                  aria-label="Минута +1"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="cd-edit-footer">
          <button type="button" className="cd-save-btn" onClick={onSave}>
            Сохранить
          </button>
          <button type="button" className="cd-reset-btn" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillCard;
