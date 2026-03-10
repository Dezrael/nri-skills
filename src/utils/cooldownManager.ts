// Утилиты для работы с перезарядками заклинаний

export interface CooldownData {
  inCombatTurns: number; // Оставшиеся ходы в бою
  outCombatMinutes: number; // Оставшееся время вне боя в минутах
}

export interface SkillChargesData {
  current: number;
  max: number;
}

const STORAGE_KEY = "skillCooldowns";
const CHARGES_STORAGE_KEY = "skillCharges";

const getSkillKey = (className: string, skillName: string) =>
  `${className}_${skillName}`;

const parseStoredRecord = <T>(storageKey: string): Record<string, T> => {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return {};

  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

const saveStoredRecord = <T>(storageKey: string, data: Record<string, T>) => {
  localStorage.setItem(storageKey, JSON.stringify(data));
};

const parseMaxCharges = (charges: string): number | null => {
  const parsed = Number.parseInt(charges, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getAllSkillCharges = (): Record<string, SkillChargesData> =>
  parseStoredRecord<SkillChargesData>(CHARGES_STORAGE_KEY);

const saveAllSkillCharges = (charges: Record<string, SkillChargesData>) => {
  saveStoredRecord(CHARGES_STORAGE_KEY, charges);
};

const getNormalizedSkillCharges = (
  skillKey: string,
  maxCharges: string,
): SkillChargesData | null => {
  const parsedMaxCharges = parseMaxCharges(maxCharges);
  if (parsedMaxCharges === null) {
    return null;
  }

  const allCharges = getAllSkillCharges();
  const storedCharges = allCharges[skillKey];

  if (!storedCharges || storedCharges.max !== parsedMaxCharges) {
    return {
      current: parsedMaxCharges,
      max: parsedMaxCharges,
    };
  }

  return {
    current: Math.max(0, Math.min(storedCharges.current, storedCharges.max)),
    max: storedCharges.max,
  };
};

const cleanupExpiredCooldowns = (cooldowns: Record<string, CooldownData>) => {
  let removedAny = false;

  Object.keys(cooldowns).forEach((key) => {
    if (
      cooldowns[key].inCombatTurns <= 0 &&
      cooldowns[key].outCombatMinutes <= 0
    ) {
      delete cooldowns[key];
      removedAny = true;
    }
  });

  return removedAny;
};

// Получить все перезарядки из localStorage
export const getAllCooldowns = (): Record<string, CooldownData> => {
  return parseStoredRecord<CooldownData>(STORAGE_KEY);
};

// Сохранить все перезарядки в localStorage
const saveAllCooldowns = (cooldowns: Record<string, CooldownData>) => {
  saveStoredRecord(STORAGE_KEY, cooldowns);
};

// Получить перезарядку конкретного заклинания
export const getCooldown = (
  className: string,
  skillName: string,
): CooldownData | null => {
  const cooldowns = getAllCooldowns();
  const key = getSkillKey(className, skillName);
  return cooldowns[key] || null;
};

export const getSkillCharges = (
  className: string,
  skillName: string,
  maxCharges: string,
): SkillChargesData | null =>
  getNormalizedSkillCharges(getSkillKey(className, skillName), maxCharges);

export const consumeSkillCharge = (
  className: string,
  skillName: string,
  maxCharges: string,
): SkillChargesData | null => {
  const skillKey = getSkillKey(className, skillName);
  const currentCharges = getNormalizedSkillCharges(skillKey, maxCharges);

  if (!currentCharges) {
    return null;
  }

  const nextCharges: SkillChargesData = {
    current: Math.max(0, currentCharges.current - 1),
    max: currentCharges.max,
  };

  const allCharges = getAllSkillCharges();
  allCharges[skillKey] = nextCharges;
  saveAllSkillCharges(allCharges);

  return nextCharges;
};

// Установить перезарядку заклинания
export const setCooldown = (
  className: string,
  skillName: string,
  data: CooldownData,
) => {
  const cooldowns = getAllCooldowns();
  const key = getSkillKey(className, skillName);
  cooldowns[key] = data;
  saveAllCooldowns(cooldowns);
};

// Удалить перезарядку заклинания (когда она закончилась)
export const removeCooldown = (className: string, skillName: string) => {
  const cooldowns = getAllCooldowns();
  const key = getSkillKey(className, skillName);
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

  if (cleanupExpiredCooldowns(cooldowns)) {
    changed = true;
  }

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

  if (cleanupExpiredCooldowns(cooldowns)) {
    changed = true;
  }

  if (changed) {
    saveAllCooldowns(cooldowns);
  }
};
