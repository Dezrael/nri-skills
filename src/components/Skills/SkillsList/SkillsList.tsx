import React, { useEffect, useState } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import SkillCard from "../SkillCard/SkillCard";
import {
  getCooldown,
  getSkillCharges,
  restoreSkillCharges,
  skipTurn,
  skipTime,
} from "../../../utils/cooldownManager";
import Tabs from "../../Tabs/Tabs";
import "./SkillsList.css";

interface SkillsListProps {
  skills: PlayerSkill[];
  className: string;
  onSelectSkill: (skill: PlayerSkill) => void;
  searchQuery?: string;
}

type SkillFilterKey = "ready" | "cooldown" | "noCharges" | "pinned";

const FILTER_LABELS: Record<SkillFilterKey, string> = {
  ready: "Готово",
  cooldown: "На кд",
  noCharges: "Нет зарядов",
  pinned: "Закреплённые",
};

const SkillsList: React.FC<SkillsListProps> = ({
  skills,
  className,
  onSelectSkill,
  searchQuery = "",
}) => {
  const allChosenSkills = skills.filter((s) => s.isChosen);

  const chosenSkills = searchQuery.trim()
    ? allChosenSkills.filter((skill) => {
        const q = searchQuery.trim().toLowerCase();
        return [
          skill.name,
          skill.shortDescription,
          skill.actionType,
          skill.range,
          skill.stat,
          skill.durationInCombat,
          skill.durationOutOfCombat,
          skill.damage,
          skill.savingThrow,
          skill.inCombatCooldown,
          skill.outCombatCooldown,
          skill.outCombatCharges,
          skill.cooldownType,
        ].some((f) => f?.toLowerCase().includes(q));
      })
    : allChosenSkills;
  const categoryLabels = Array.from(
    new Set(
      allChosenSkills.map((skill) => {
        const normalizedCategory = skill.category?.trim();
        return normalizedCategory && normalizedCategory.length > 0
          ? normalizedCategory
          : "Основные";
      }),
    ),
  ).sort((a, b) => {
    if (a === "Основные") return -1;
    if (b === "Основные") return 1;
    return a.localeCompare(b);
  });
  const shouldShowCategoryTabs =
    categoryLabels.length > 1 && !searchQuery.trim();
  const defaultCategory = categoryLabels[0] || "Основные";
  const [activeCategoryTab, setActiveCategoryTab] = useState(defaultCategory);
  const [cooldownKey, setCooldownKey] = useState(0);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [pendingRestType, setPendingRestType] = useState<
    "short" | "long" | null
  >(null);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Set<SkillFilterKey>>(
    () => new Set(),
  );
  const [pinnedSkillIds, setPinnedSkillIds] = useState<Set<number>>(() => {
    const stored = localStorage.getItem(`pinned-skills-${className}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const handleTogglePin = (skillId: number | undefined) => {
    if (skillId === undefined) return;
    const newPinned = new Set(pinnedSkillIds);
    if (newPinned.has(skillId)) {
      newPinned.delete(skillId);
    } else {
      newPinned.add(skillId);
    }
    setPinnedSkillIds(newPinned);
    localStorage.setItem(
      `pinned-skills-${className}`,
      JSON.stringify(Array.from(newPinned)),
    );
  };

  useEffect(() => {
    if (!categoryLabels.includes(activeCategoryTab)) {
      setActiveCategoryTab(defaultCategory);
    }
  }, [activeCategoryTab, categoryLabels, defaultCategory]);

  useEffect(() => {
    const stored = localStorage.getItem(`pinned-skills-${className}`);
    setPinnedSkillIds(stored ? new Set(JSON.parse(stored)) : new Set());
    setActiveFilters(new Set());
  }, [className]);

  const handleToggleFilter = (filterKey: SkillFilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filterKey)) {
        next.delete(filterKey);
      } else {
        next.add(filterKey);
      }
      return next;
    });
  };

  const filteredSkills = chosenSkills.filter((skill) => {
    if (activeFilters.size === 0) {
      return true;
    }

    const cooldown = getCooldown(className, skill.name);
    const charges = getSkillCharges(
      className,
      skill.name,
      skill.outCombatCharges,
    );
    const isPinned = skill.id ? pinnedSkillIds.has(skill.id) : false;
    const isOnCooldown =
      !!cooldown &&
      (cooldown.inCombatTurns > 0 || cooldown.outCombatMinutes > 0);
    const hasChargesAvailable = !charges || charges.current > 0;
    const hasNoCharges = !!charges && charges.current <= 0;
    const isReady = !isOnCooldown && hasChargesAvailable;

    if (activeFilters.has("ready") && !isReady) {
      return false;
    }

    if (activeFilters.has("cooldown") && !isOnCooldown) {
      return false;
    }

    if (activeFilters.has("noCharges") && !hasNoCharges) {
      return false;
    }

    if (activeFilters.has("pinned") && !isPinned) {
      return false;
    }

    return true;
  });

  const visibleSkills = shouldShowCategoryTabs
    ? filteredSkills
        .filter((skill) => {
          const normalizedCategory = skill.category?.trim();
          const categoryLabel =
            normalizedCategory && normalizedCategory.length > 0
              ? normalizedCategory
              : "Основные";
          return categoryLabel === activeCategoryTab;
        })
        .sort((a, b) => {
          const aPinned = a.id ? pinnedSkillIds.has(a.id) : false;
          const bPinned = b.id ? pinnedSkillIds.has(b.id) : false;
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return 0;
        })
    : filteredSkills.sort((a, b) => {
        const aPinned = a.id ? pinnedSkillIds.has(a.id) : false;
        const bPinned = b.id ? pinnedSkillIds.has(b.id) : false;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });

  const handleSkipTurn = () => {
    setPendingRestType(null);
    skipTurn();
    setCooldownKey((prev) => prev + 1); // Trigger re-render
  };

  const restoreShortRestCharges = () => {
    let restoredAny = false;

    chosenSkills.forEach((skill) => {
      const hasCharges = (Number(skill.outCombatCharges) || 0) > 0;
      const cooldownType = skill.cooldownType?.trim().toLowerCase();

      if (hasCharges && cooldownType === "до короткого отдыха") {
        const restored = restoreSkillCharges(
          className,
          skill.name,
          skill.outCombatCharges,
        );
        if (restored) {
          restoredAny = true;
        }
      }
    });

    return restoredAny;
  };

  const restoreLongRestCharges = () => {
    let restoredAny = false;

    chosenSkills.forEach((skill) => {
      const hasCharges = (Number(skill.outCombatCharges) || 0) > 0;

      if (hasCharges) {
        const restored = restoreSkillCharges(
          className,
          skill.name,
          skill.outCombatCharges,
        );
        if (restored) {
          restoredAny = true;
        }
      }
    });

    return restoredAny;
  };

  const handleShortRest = () => {
    setPendingRestType("short");
  };

  const handleLongRest = () => {
    setPendingRestType("long");
  };

  const handleConfirmRest = () => {
    if (pendingRestType === "short") {
      restoreShortRestCharges();
      skipTime("4 часа");
    }

    if (pendingRestType === "long") {
      restoreLongRestCharges();
      skipTime("8 часов");
    }

    setPendingRestType(null);
    setCooldownKey((prev) => prev + 1);
  };

  const handleToggleControls = () => {
    setIsControlsExpanded((prev) => !prev);
    setPendingRestType(null);
  };

  const handleSkipTime = () => {
    const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
    if (totalMinutes > 0) {
      setPendingRestType(null);
      const parts: string[] = [];
      if (days > 0)
        parts.push(
          `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`,
        );
      if (hours > 0)
        parts.push(
          `${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"}`,
        );
      if (minutes > 0)
        parts.push(
          `${minutes} ${minutes === 1 ? "минута" : minutes < 5 ? "минуты" : "минут"}`,
        );

      skipTime(parts.join(" "));
      setCooldownKey((prev) => prev + 1); // Trigger re-render
      setDays(0);
      setHours(0);
      setMinutes(0);
      setShowTimeModal(false);
    }
  };

  if (chosenSkills.length === 0) {
    return <div className="skills-list empty">Нет выбранных заклинаний</div>;
  }

  return (
    <div className="skills-list-container">
      <div className="skills-header">
        <h2>Выбранные заклинания</h2>
      </div>

      <div className="skill-filters" aria-label="Фильтры заклинаний">
        {(Object.keys(FILTER_LABELS) as SkillFilterKey[]).map((filterKey) => (
          <button
            key={filterKey}
            type="button"
            className={`skill-filter-chip ${
              activeFilters.has(filterKey) ? "active" : ""
            }`}
            onClick={() => handleToggleFilter(filterKey)}
            aria-pressed={activeFilters.has(filterKey)}
          >
            {FILTER_LABELS[filterKey]}
          </button>
        ))}
      </div>

      <div className="floating-controls-shell">
        {pendingRestType && (
          <div
            className="rest-confirm-popover"
            role="dialog"
            aria-modal="false"
          >
            <p className="rest-confirm-text">
              {pendingRestType === "short"
                ? "Восстановить заряды после короткого отдыха?"
                : "Восстановить все заряды после долгого отдыха?"}
            </p>
            <div className="rest-confirm-actions">
              <button
                type="button"
                className="rest-confirm-btn confirm"
                onClick={handleConfirmRest}
              >
                Да
              </button>
              <button
                type="button"
                className="rest-confirm-btn cancel"
                onClick={() => setPendingRestType(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <div
          className={`time-controls floating-time-controls ${
            isControlsExpanded ? "expanded" : "collapsed"
          }`}
        >
          {isControlsExpanded && (
            <>
              <button
                onClick={handleSkipTurn}
                className="time-btn skip-turn icon-only-time-btn"
                title="Пропустить ход"
                aria-label="Пропустить ход"
              >
                <span
                  className="material-symbols-rounded btn-icon"
                  aria-hidden="true"
                >
                  swords
                </span>
              </button>
              <button
                onClick={() => {
                  setPendingRestType(null);
                  setShowTimeModal(true);
                }}
                className="time-btn skip-time icon-only-time-btn"
                title="Пропустить время"
                aria-label="Пропустить время"
              >
                <span
                  className="material-symbols-rounded btn-icon"
                  aria-hidden="true"
                >
                  schedule
                </span>
              </button>
              <button
                onClick={handleShortRest}
                className="time-btn short-rest icon-only-time-btn"
                title="Короткий отдых"
                aria-label="Короткий отдых"
              >
                <span
                  className="material-symbols-rounded btn-icon"
                  aria-hidden="true"
                >
                  hotel
                </span>
              </button>
              <button
                onClick={handleLongRest}
                className="time-btn long-rest icon-only-time-btn"
                title="Долгий отдых"
                aria-label="Долгий отдых"
              >
                <span
                  className="material-symbols-rounded btn-icon"
                  aria-hidden="true"
                >
                  bedtime
                </span>
              </button>
            </>
          )}

          <button
            onClick={handleToggleControls}
            className="time-btn dock-toggle-btn"
            title={isControlsExpanded ? "Свернуть панель" : "Развернуть панель"}
            aria-label={
              isControlsExpanded ? "Свернуть панель" : "Развернуть панель"
            }
          >
            <span
              className="material-symbols-rounded btn-icon"
              aria-hidden="true"
            >
              {isControlsExpanded ? "close" : "tune"}
            </span>
          </button>
        </div>
      </div>

      {shouldShowCategoryTabs && (
        <Tabs
          tabs={categoryLabels.map((categoryLabel) => ({
            id: categoryLabel,
            label: categoryLabel,
          }))}
          activeTab={activeCategoryTab}
          onTabChange={setActiveCategoryTab}
        />
      )}

      {showTimeModal && (
        <div
          className="time-modal-overlay"
          onClick={() => setShowTimeModal(false)}
        >
          <div className="time-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Пропустить время</h3>
            <p>Укажите период времени</p>

            <div className="time-inputs-grid">
              <div className="time-input-group">
                <label htmlFor="days-input">Дни</label>
                <div className="number-input-wrapper">
                  <button
                    type="button"
                    className="number-btn decrease"
                    onClick={() => setDays(Math.max(0, days - 1))}
                  >
                    −
                  </button>
                  <input
                    id="days-input"
                    type="number"
                    min="0"
                    max="365"
                    value={days}
                    onChange={(e) =>
                      setDays(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="time-number-input"
                  />
                  <button
                    type="button"
                    className="number-btn increase"
                    onClick={() => setDays(Math.min(365, days + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="time-input-group">
                <label htmlFor="hours-input">Часы</label>
                <div className="number-input-wrapper">
                  <button
                    type="button"
                    className="number-btn decrease"
                    onClick={() => setHours(Math.max(0, hours - 1))}
                  >
                    −
                  </button>
                  <input
                    id="hours-input"
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) =>
                      setHours(
                        Math.max(
                          0,
                          Math.min(23, parseInt(e.target.value) || 0),
                        ),
                      )
                    }
                    className="time-number-input"
                  />
                  <button
                    type="button"
                    className="number-btn increase"
                    onClick={() => setHours(Math.min(23, hours + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="time-input-group">
                <label htmlFor="minutes-input">Минуты</label>
                <div className="number-input-wrapper">
                  <button
                    type="button"
                    className="number-btn decrease"
                    onClick={() => setMinutes(Math.max(0, minutes - 1))}
                  >
                    −
                  </button>
                  <input
                    id="minutes-input"
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) =>
                      setMinutes(
                        Math.max(
                          0,
                          Math.min(59, parseInt(e.target.value) || 0),
                        ),
                      )
                    }
                    className="time-number-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="number-btn increase"
                    onClick={() => setMinutes(Math.min(59, minutes + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleSkipTime}
                className="confirm-btn"
                disabled={days === 0 && hours === 0 && minutes === 0}
              >
                <span
                  className="material-symbols-rounded btn-icon"
                  aria-hidden="true"
                >
                  done
                </span>
                Пропустить
              </button>
              <button
                onClick={() => {
                  setShowTimeModal(false);
                  setDays(0);
                  setHours(0);
                  setMinutes(0);
                }}
                className="cancel-btn"
              >
                <span
                  className="material-symbols-rounded btn-icon"
                  aria-hidden="true"
                >
                  close
                </span>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="skills-list">
        {visibleSkills.length === 0 ? (
          <div className="skills-list empty">Ничего не найдено</div>
        ) : (
          visibleSkills.map((skill) => (
            <SkillCard
              key={`${skill.name}-${cooldownKey}`}
              skill={skill}
              className={className}
              onSelectSkill={onSelectSkill}
              onCooldownChange={() => setCooldownKey((prev) => prev + 1)}
              isPinned={skill.id ? pinnedSkillIds.has(skill.id) : false}
              onTogglePin={handleTogglePin}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SkillsList;
