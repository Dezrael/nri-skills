import React from "react";
import "./TimeAdjustModal.css";

type BaseProps = {
  title: string;
  description?: string;
  onSave: () => void;
  onClose: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
};

type TurnsModeProps = BaseProps & {
  mode: "turns";
  value: number;
  onChange: (value: number) => void;
  autoFocus?: boolean;
};

type TimeModeProps = BaseProps & {
  mode: "time";
  days: number;
  hours: number;
  minutes: number;
  onDaysChange: (value: number) => void;
  onHoursChange: (value: number) => void;
  onMinutesChange: (value: number) => void;
  maxDays?: number;
  maxHours?: number;
  maxMinutes?: number;
  autoFocusField?: "days" | "hours" | "minutes";
};

export type TimeAdjustModalProps = TurnsModeProps | TimeModeProps;

const normalizeInputValue = (value: string, max?: number) => {
  const parsed = Math.floor(Number(value) || 0);
  const normalized = Math.max(0, parsed);
  return max === undefined ? normalized : Math.min(max, normalized);
};

const TimeAdjustModal: React.FC<TimeAdjustModalProps> = (props) => {
  return (
    <div
      className="time-adjust-overlay"
      onClick={props.onClose}
      role="dialog"
      aria-modal="true"
      aria-label={props.title}
    >
      <div className="time-adjust-panel" onClick={(e) => e.stopPropagation()}>
        <div className="time-adjust-header">
          <span className="time-adjust-title">{props.title}</span>
          <button
            type="button"
            className="time-adjust-close"
            onClick={props.onClose}
            aria-label="Закрыть"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="time-adjust-body">
          {props.description && <p>{props.description}</p>}

          {props.mode === "turns" ? (
            <div className="time-adjust-turns-row">
              <button
                type="button"
                className="time-adjust-step-btn"
                onClick={() => props.onChange(Math.max(0, props.value - 1))}
                aria-label="Уменьшить на 1 ход"
              >
                −1
              </button>
              <input
                type="number"
                className="time-adjust-turns-input"
                inputMode="numeric"
                min={0}
                value={props.value}
                onChange={(e) =>
                  props.onChange(normalizeInputValue(e.target.value))
                }
                autoFocus={props.autoFocus}
                aria-label="Количество ходов"
              />
              <button
                type="button"
                className="time-adjust-step-btn"
                onClick={() => props.onChange(props.value + 1)}
                aria-label="Увеличить на 1 ход"
              >
                +1
              </button>
            </div>
          ) : (
            <div className="time-adjust-grid">
              <div className="time-adjust-unit">
                <button
                  type="button"
                  className="time-adjust-step-btn increase"
                  onClick={() =>
                    props.onDaysChange(
                      normalizeInputValue(
                        String(props.days + 1),
                        props.maxDays,
                      ),
                    )
                  }
                  aria-label="День +1"
                >
                  +
                </button>
                <div className="time-adjust-value">
                  <input
                    id="time-adjust-days"
                    type="number"
                    className="time-adjust-input"
                    inputMode="numeric"
                    min={0}
                    max={props.maxDays}
                    value={props.days}
                    onChange={(e) =>
                      props.onDaysChange(
                        normalizeInputValue(e.target.value, props.maxDays),
                      )
                    }
                    autoFocus={props.autoFocusField === "days"}
                    aria-label="Дни"
                  />
                  <span className="time-adjust-label">дн.</span>
                </div>
                <button
                  type="button"
                  className="time-adjust-step-btn decrease"
                  onClick={() =>
                    props.onDaysChange(Math.max(0, props.days - 1))
                  }
                  aria-label="День −1"
                >
                  −
                </button>
              </div>

              <div className="time-adjust-unit">
                <button
                  type="button"
                  className="time-adjust-step-btn increase"
                  onClick={() =>
                    props.onHoursChange(
                      normalizeInputValue(
                        String(props.hours + 1),
                        props.maxHours,
                      ),
                    )
                  }
                  aria-label="Час +1"
                >
                  +
                </button>
                <div className="time-adjust-value">
                  <input
                    id="time-adjust-hours"
                    type="number"
                    className="time-adjust-input"
                    inputMode="numeric"
                    min={0}
                    max={props.maxHours}
                    value={props.hours}
                    onChange={(e) =>
                      props.onHoursChange(
                        normalizeInputValue(e.target.value, props.maxHours),
                      )
                    }
                    autoFocus={props.autoFocusField === "hours"}
                    aria-label="Часы"
                  />
                  <span className="time-adjust-label">ч.</span>
                </div>
                <button
                  type="button"
                  className="time-adjust-step-btn decrease"
                  onClick={() =>
                    props.onHoursChange(Math.max(0, props.hours - 1))
                  }
                  aria-label="Час −1"
                >
                  −
                </button>
              </div>

              <div className="time-adjust-unit">
                <button
                  type="button"
                  className="time-adjust-step-btn increase"
                  onClick={() =>
                    props.onMinutesChange(
                      normalizeInputValue(
                        String(props.minutes + 1),
                        props.maxMinutes,
                      ),
                    )
                  }
                  aria-label="Минута +1"
                >
                  +
                </button>
                <div className="time-adjust-value">
                  <input
                    id="time-adjust-minutes"
                    type="number"
                    className="time-adjust-input"
                    inputMode="numeric"
                    min={0}
                    max={props.maxMinutes}
                    value={props.minutes}
                    onChange={(e) =>
                      props.onMinutesChange(
                        normalizeInputValue(e.target.value, props.maxMinutes),
                      )
                    }
                    autoFocus={props.autoFocusField === "minutes"}
                    aria-label="Минуты"
                  />
                  <span className="time-adjust-label">мин.</span>
                </div>
                <button
                  type="button"
                  className="time-adjust-step-btn decrease"
                  onClick={() =>
                    props.onMinutesChange(Math.max(0, props.minutes - 1))
                  }
                  aria-label="Минута −1"
                >
                  −
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="time-adjust-footer">
          <button
            type="button"
            className="time-adjust-save-btn"
            onClick={props.onSave}
            disabled={props.saveDisabled}
          >
            {props.saveLabel || "Сохранить"}
          </button>
          <button
            type="button"
            className="time-adjust-cancel-btn"
            onClick={props.onClose}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeAdjustModal;
