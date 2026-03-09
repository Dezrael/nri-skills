import React, { useState } from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import SkillCard from "../SkillCard/SkillCard";
import { skipTurn, skipTime } from "../../../utils/cooldownManager";
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
  const [cooldownKey, setCooldownKey] = useState(0);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

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
      </div>

      <div className="time-controls">
        <button onClick={handleSkipTurn} className="time-btn skip-turn">
          ⚔️ Пропустить ход
        </button>
        <button
          onClick={() => setShowTimeModal(true)}
          className="time-btn skip-time"
        >
          ⏰ Пропустить время
        </button>
      </div>

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
                ✅ Пропустить
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
                ❌ Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="skills-list">
        {chosenSkills.map((skill) => (
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
