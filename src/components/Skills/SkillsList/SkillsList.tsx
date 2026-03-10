import React, { useEffect, useState } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import SkillCard from "../SkillCard/SkillCard";
import { skipTurn, skipTime } from "../../../utils/cooldownManager";
import Tabs from "../../Tabs/Tabs";
import "./SkillsList.css";

interface SkillsListProps {
  skills: PlayerSkill[];
  className: string;
  onSelectSkill: (skill: PlayerSkill) => void;
}

const SkillsList: React.FC<SkillsListProps> = ({
  skills,
  className,
  onSelectSkill,
}) => {
  const chosenSkills = skills.filter((s) => s.isChosen);
  const categoryLabels = Array.from(
    new Set(
      chosenSkills.map((skill) => {
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
  const shouldShowCategoryTabs = categoryLabels.length > 1;
  const defaultCategory = categoryLabels[0] || "Основные";
  const [activeCategoryTab, setActiveCategoryTab] = useState(defaultCategory);
  const [cooldownKey, setCooldownKey] = useState(0);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!categoryLabels.includes(activeCategoryTab)) {
      setActiveCategoryTab(defaultCategory);
    }
  }, [activeCategoryTab, categoryLabels, defaultCategory]);

  const visibleSkills = shouldShowCategoryTabs
    ? chosenSkills.filter((skill) => {
        const normalizedCategory = skill.category?.trim();
        const categoryLabel =
          normalizedCategory && normalizedCategory.length > 0
            ? normalizedCategory
            : "Основные";
        return categoryLabel === activeCategoryTab;
      })
    : chosenSkills;

  const handleSkipTurn = () => {
    skipTurn();
    setCooldownKey((prev) => prev + 1); // Trigger re-render
  };

  const handleSkipTime = () => {
    const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
    if (totalMinutes > 0) {
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
        <div className="time-controls">
          <button onClick={handleSkipTurn} className="time-btn skip-turn">
            <span
              className="material-symbols-rounded btn-icon"
              aria-hidden="true"
            >
              swords
            </span>
            Пропустить ход
          </button>
          <button
            onClick={() => setShowTimeModal(true)}
            className="time-btn skip-time"
          >
            <span
              className="material-symbols-rounded btn-icon"
              aria-hidden="true"
            >
              schedule
            </span>
            Пропустить время
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
        {visibleSkills.map((skill) => (
          <SkillCard
            key={`${skill.name}-${cooldownKey}`}
            skill={skill}
            className={className}
            onSelectSkill={onSelectSkill}
            onCooldownChange={() => setCooldownKey((prev) => prev + 1)}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillsList;
