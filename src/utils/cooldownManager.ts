// Утилиты для работы с перезарядками заклинаний

export interface CooldownData {
  inCombatTurns: number; // Оставшиеся ходы в бою
  outCombatMinutes: number; // Оставшееся время вне боя в минутах
}

const STORAGE_KEY = "skillCooldowns";

// Получить все перезарядки из localStorage
export const getAllCooldowns = (): Record<string, CooldownData> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

// Сохранить все перезарядки в localStorage
const saveAllCooldowns = (cooldowns: Record<string, CooldownData>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cooldowns));
};

// Получить перезарядку конкретного заклинания
export const getCooldown = (
  className: string,
  skillName: string,
): CooldownData | null => {
  const cooldowns = getAllCooldowns();
  const key = `${className}_${skillName}`;
  return cooldowns[key] || null;
};

// Установить перезарядку заклинания
export const setCooldown = (
  className: string,
  skillName: string,
  data: CooldownData,
) => {
  const cooldowns = getAllCooldowns();
  const key = `${className}_${skillName}`;
  cooldowns[key] = data;
  saveAllCooldowns(cooldowns);
};

// Удалить перезарядку заклинания (когда она закончилась)
export const removeCooldown = (className: string, skillName: string) => {
  const cooldowns = getAllCooldowns();
  const key = `${className}_${skillName}`;
  delete cooldowns[key];
  saveAllCooldowns(cooldowns);
};

// Конвертировать строку времени в минуты
export const timeStringToMinutes = (timeStr: string): number => {
  if (!timeStr || timeStr === "-" || timeStr === "∞") return 0;

  const hoursMatch = timeStr.match(/(\d+)\s*(час|hours?)/i);
  const minutesMatch = timeStr.match(/(\d+)\s*(минут|minutes?)/i);
  const daysMatch = timeStr.match(/(\d+)\s*(дней|день|days?)/i);

  let totalMinutes = 0;

  if (daysMatch) {
    totalMinutes += parseInt(daysMatch[1]) * 24 * 60;
  }
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }

  return totalMinutes;
};

// Конвертировать минуты обратно в строку времени
export const minutesToTimeString = (minutes: number): string => {
  if (minutes <= 0) return "Готово";

  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`);
  }
  if (hours > 0) {
    parts.push(
      `${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"}`,
    );
  }
  if (mins > 0) {
    parts.push(
      `${mins} ${mins === 1 ? "минута" : mins < 5 ? "минуты" : "минут"}`,
    );
  }

  return parts.join(" ");
};

// Использовать заклинание в бою
export const playerUseSkillInCombat = (
  className: string,
  skillName: string,
  cooldownTurns: string,
) => {
  const turns = parseInt(cooldownTurns);
  if (isNaN(turns) || turns <= 0) return;

  const currentCooldown = getCooldown(className, skillName);
  setCooldown(className, skillName, {
    inCombatTurns: turns,
    outCombatMinutes: currentCooldown?.outCombatMinutes || 0,
  });
};

// Использовать заклинание вне боя
export const playerUseSkillOutOfCombat = (
  className: string,
  skillName: string,
  cooldownStr: string,
) => {
  const minutes = timeStringToMinutes(cooldownStr);
  if (minutes <= 0) return;

  const currentCooldown = getCooldown(className, skillName);
  setCooldown(className, skillName, {
    inCombatTurns: currentCooldown?.inCombatTurns || 0,
    outCombatMinutes: minutes,
  });
};

// Пропустить ход (уменьшить все боевые перезарядки на 1)
export const skipTurn = () => {
  const cooldowns = getAllCooldowns();
  let changed = false;

  Object.keys(cooldowns).forEach((key) => {
    if (cooldowns[key].inCombatTurns > 0) {
      cooldowns[key].inCombatTurns -= 1;
      changed = true;
    }
  });

  if (changed) {
    saveAllCooldowns(cooldowns);
  }
};

// Пропустить время (уменьшить все внебоевые перезарядки)
export const skipTime = (timeStr: string) => {
  const minutesToSkip = timeStringToMinutes(timeStr);
  if (minutesToSkip <= 0) return;

  const cooldowns = getAllCooldowns();
  let changed = false;

  Object.keys(cooldowns).forEach((key) => {
    if (cooldowns[key].outCombatMinutes > 0) {
      cooldowns[key].outCombatMinutes = Math.max(
        0,
        cooldowns[key].outCombatMinutes - minutesToSkip,
      );
      changed = true;
    }
  });

  if (changed) {
    saveAllCooldowns(cooldowns);
  }
};
