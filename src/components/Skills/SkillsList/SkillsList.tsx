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
import TimeAdjustModal from "../TimeAdjustModal/TimeAdjustModal";
import "./SkillsList.css";

interface SkillsListProps {
  skills: PlayerSkill[];
  className: string;
  onSelectSkill: (skill: PlayerSkill) => void;
  searchQuery?: string;
  searchInDescription?: boolean;
  onVisibleCountChange?: (count: number) => void;
}

type SkillFilterKey = "ready" | "cooldown" | "noCharges" | "pinned";
type SkillSortMode = "pinned" | "ready" | "actionType";

const FILTER_LABELS: Record<SkillFilterKey, string> = {
  ready: "Готово",
  cooldown: "На кд",
  noCharges: "Нет зарядов",
  pinned: "Закреплённые",
};

const SORT_LABELS: Record<SkillSortMode, string> = {
  pinned: "Закреплённые",
  ready: "Сначала готовые",
  actionType: "По типу действия",
};

const SORT_OPTIONS: SkillSortMode[] = ["pinned", "ready", "actionType"];
const COMBAT_MODE_STORAGE_KEY_PREFIX = "combat-mode";

const SkillsList: React.FC<SkillsListProps> = ({
  skills,
  className,
  onSelectSkill,
  searchQuery = "",
  searchInDescription = false,
  onVisibleCountChange,
}) => {
  const allChosenSkills = skills.filter((s) => s.isChosen);

  const chosenSkills = searchQuery.trim()
    ? allChosenSkills.filter((skill) => {
        const q = searchQuery.trim().toLowerCase();
        return [
          skill.name,
          skill.shortDescription,
          ...(searchInDescription ? [skill.description] : []),
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
  const [isCombatMode, setIsCombatMode] = useState(() => {
    const stored = localStorage.getItem(
      `${COMBAT_MODE_STORAGE_KEY_PREFIX}-${className}`,
    );
    return stored === "true";
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<SkillFilterKey>>(
    () => new Set(),
  );
  const [activeSort, setActiveSort] = useState<SkillSortMode>("pinned");
  const [pinnedSkillIds, setPinnedSkillIds] = useState<Set<number>>(() => {
    const stored = localStorage.getItem(`pinned-skills-${className}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const getCategoryLabel = (skill: PlayerSkill) => {
    const normalizedCategory = skill.category?.trim();
    return normalizedCategory && normalizedCategory.length > 0
      ? normalizedCategory
      : "Основные";
  };

  const getActionTypeLabel = (skill: PlayerSkill) => {
    const normalizedActionType = skill.actionType?.trim();
    return normalizedActionType && normalizedActionType !== "-"
      ? normalizedActionType
      : "Без типа";
  };

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
    setActiveSort("pinned");

    const storedCombatMode = localStorage.getItem(
      `${COMBAT_MODE_STORAGE_KEY_PREFIX}-${className}`,
    );
    setIsCombatMode(storedCombatMode === "true");
  }, [className]);

  useEffect(() => {
    localStorage.setItem(
      `${COMBAT_MODE_STORAGE_KEY_PREFIX}-${className}`,
      String(isCombatMode),
    );
  }, [className, isCombatMode]);

  useEffect(() => {
    if (!feedbackMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

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

  const skillStateMap = new Map<
    PlayerSkill,
    {
      isPinned: boolean;
      isOnCooldown: boolean;
      hasNoCharges: boolean;
      isReady: boolean;
      categoryLabel: string;
      actionTypeLabel: string;
    }
  >();

  chosenSkills.forEach((skill) => {
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

    skillStateMap.set(skill, {
      isPinned,
      isOnCooldown,
      hasNoCharges,
      isReady,
      categoryLabel: getCategoryLabel(skill),
      actionTypeLabel: getActionTypeLabel(skill),
    });
  });

  const filteredSkills = chosenSkills.filter((skill) => {
    if (activeFilters.size === 0) {
      return true;
    }

    const skillState = skillStateMap.get(skill);
    if (!skillState) {
      return true;
    }

    if (activeFilters.has("ready") && !skillState.isReady) {
      return false;
    }

    if (activeFilters.has("cooldown") && !skillState.isOnCooldown) {
      return false;
    }

    if (activeFilters.has("noCharges") && !skillState.hasNoCharges) {
      return false;
    }

    if (activeFilters.has("pinned") && !skillState.isPinned) {
      return false;
    }

    return true;
  });

  const categoryFilteredSkills = shouldShowCategoryTabs
    ? filteredSkills.filter((skill) => {
        const categoryLabel = skillStateMap.get(skill)?.categoryLabel;
        return categoryLabel === activeCategoryTab;
      })
    : filteredSkills;

  const visibleSkills = [...categoryFilteredSkills].sort((a, b) => {
    const aState = skillStateMap.get(a);
    const bState = skillStateMap.get(b);
    const aName = a.name || "";
    const bName = b.name || "";

    if (!aState || !bState) {
      return aName.localeCompare(bName, "ru");
    }

    if (activeSort === "pinned") {
      if (aState.isPinned && !bState.isPinned) return -1;
      if (!aState.isPinned && bState.isPinned) return 1;
      return aName.localeCompare(bName, "ru");
    }

    if (activeSort === "ready") {
      if (aState.isReady && !bState.isReady) return -1;
      if (!aState.isReady && bState.isReady) return 1;
      return aName.localeCompare(bName, "ru");
    }

    if (
      aState.actionTypeLabel === "Без типа" &&
      bState.actionTypeLabel !== "Без типа"
    )
      return 1;
    if (
      aState.actionTypeLabel !== "Без типа" &&
      bState.actionTypeLabel === "Без типа"
    )
      return -1;

    const actionTypeCompare = aState.actionTypeLabel.localeCompare(
      bState.actionTypeLabel,
      "ru",
    );
    if (actionTypeCompare !== 0) {
      return actionTypeCompare;
    }

    return aName.localeCompare(bName, "ru");
  });

  useEffect(() => {
    onVisibleCountChange?.(visibleSkills.length);
  }, [onVisibleCountChange, visibleSkills.length]);

  const handleSkipTurn = () => {
    setPendingRestType(null);
    skipTurn();
    setCooldownKey((prev) => prev + 1); // Trigger re-render
    setFeedbackMessage("Пропущен 1 ход");
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
    let feedback = "";

    if (pendingRestType === "short") {
      const restored = restoreShortRestCharges();
      skipTime("4 часа");
      feedback = restored
        ? "Прошло 4 часа, восстановлены заряды"
        : "Прошло 4 часа";
    }

    if (pendingRestType === "long") {
      const restored = restoreLongRestCharges();
      skipTime("8 часов");
      feedback = restored
        ? "Прошло 8 часов, восстановлены заряды"
        : "Прошло 8 часов";
    }

    setPendingRestType(null);
    setCooldownKey((prev) => prev + 1);
    if (feedback) {
      setFeedbackMessage(feedback);
    }
  };

  const handleToggleControls = () => {
    setIsControlsExpanded((prev) => !prev);
    setPendingRestType(null);
  };

  const handleCloseTimeModal = () => {
    setShowTimeModal(false);
    setDays(0);
    setHours(0);
    setMinutes(0);
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
      handleCloseTimeModal();
      setFeedbackMessage(`Прошло: ${parts.join(" ")}`);
    }
  };

  if (chosenSkills.length === 0) {
    return <div className="skills-list empty">Нет выбранных заклинаний</div>;
  }

  return (
    <div
      className={`skills-list-container ${isCombatMode ? "combat-mode" : ""}`}
    >
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

      <div className="skill-sort-row">
        <label className="skill-sort-label" htmlFor="skill-sort-select">
          <span className="material-symbols-rounded" aria-hidden="true">
            sort
          </span>
          Сортировка:
        </label>
        <select
          id="skill-sort-select"
          className="skill-sort-select"
          value={activeSort}
          onChange={(e) => setActiveSort(e.target.value as SkillSortMode)}
        >
          {SORT_OPTIONS.map((sortKey) => (
            <option key={sortKey} value={sortKey}>
              {SORT_LABELS[sortKey]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`combat-mode-toggle ${isCombatMode ? "active" : ""}`}
          onClick={() => setIsCombatMode((prev) => !prev)}
          aria-pressed={isCombatMode}
          title={
            isCombatMode ? "Выключить боевой режим" : "Включить боевой режим"
          }
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            swords
          </span>
          {isCombatMode ? "Боевой режим: ON" : "Боевой режим"}
        </button>
      </div>

      {feedbackMessage && (
        <div className="action-feedback-toast" role="status" aria-live="polite">
          {feedbackMessage}
        </div>
      )}

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
        <TimeAdjustModal
          mode="time"
          title="Пропустить время"
          description="Укажите период времени"
          days={days}
          onDaysChange={setDays}
          hours={hours}
          onHoursChange={setHours}
          minutes={minutes}
          onMinutesChange={setMinutes}
          maxDays={365}
          maxHours={23}
          maxMinutes={59}
          autoFocusField="minutes"
          saveLabel="Пропустить"
          saveDisabled={days === 0 && hours === 0 && minutes === 0}
          onSave={handleSkipTime}
          onClose={handleCloseTimeModal}
        />
      )}

      <div className="skills-list">
        {visibleSkills.length === 0 ? (
          <div className="skills-list empty">Ничего не найдено</div>
        ) : (
          visibleSkills.map((skill) => (
            <SkillCard
              key={skill.id ?? skill.name}
              skill={skill}
              className={className}
              onSelectSkill={onSelectSkill}
              onCooldownChange={() => setCooldownKey((prev) => prev + 1)}
              onActionFeedback={setFeedbackMessage}
              isPinned={skill.id ? pinnedSkillIds.has(skill.id) : false}
              onTogglePin={handleTogglePin}
              cooldownVersion={cooldownKey}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SkillsList;
