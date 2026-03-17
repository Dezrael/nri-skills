// Утилиты для работы с перезарядками заклинаний

export interface CooldownData {
  inCombatTurns: number; // Оставшиеся ходы в бою
  outCombatMinutes: number; // Оставшееся время вне боя в минутах
  durationInCombatTurns: number; // Оставшаяся длительность в бою (ходы)
  durationOutCombatMinutes: number; // Оставшаяся длительность вне боя (минуты)
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

type DiceEvalOptions = {
  rollDice?: boolean;
};

type ParserState = {
  expression: string;
  index: number;
  rollDice: boolean;
};

const rollDie = (sides: number): number =>
  Math.floor(Math.random() * sides) + 1;

const skipSpaces = (state: ParserState) => {
  while (state.index < state.expression.length) {
    const char = state.expression[state.index];
    if (char !== " " && char !== "\t" && char !== "\n") {
      break;
    }
    state.index += 1;
  }
};

const parseNumber = (state: ParserState): number | null => {
  skipSpaces(state);
  const start = state.index;

  while (state.index < state.expression.length) {
    const char = state.expression[state.index];
    if (char < "0" || char > "9") {
      break;
    }
    state.index += 1;
  }

  if (start === state.index) {
    return null;
  }

  return Number.parseInt(state.expression.slice(start, state.index), 10);
};

const parseFactor = (state: ParserState): number | null => {
  skipSpaces(state);
  if (state.index >= state.expression.length) {
    return null;
  }

  const char = state.expression[state.index];

  if (char === "+") {
    state.index += 1;
    return parseFactor(state);
  }

  if (char === "-") {
    state.index += 1;
    const value = parseFactor(state);
    return value === null ? null : -value;
  }

  if (char === "(") {
    state.index += 1;
    const value = parseExpressionInternal(state);
    skipSpaces(state);
    if (value === null || state.expression[state.index] !== ")") {
      return null;
    }
    state.index += 1;
    return value;
  }

  if (char === "d" || char === "D") {
    state.index += 1;
    const sides = parseNumber(state);
    if (!sides || sides <= 0) {
      return null;
    }
    return state.rollDice ? rollDie(sides) : (1 + sides) / 2;
  }

  const firstNumber = parseNumber(state);
  if (firstNumber === null) {
    return null;
  }

  skipSpaces(state);
  const maybeDice = state.expression[state.index];
  if (maybeDice === "d" || maybeDice === "D") {
    state.index += 1;
    const sides = parseNumber(state);
    if (!sides || sides <= 0 || firstNumber <= 0) {
      return null;
    }

    let total = 0;
    for (let i = 0; i < firstNumber; i += 1) {
      total += state.rollDice ? rollDie(sides) : (1 + sides) / 2;
    }
    return total;
  }

  return firstNumber;
};

const parseTerm = (state: ParserState): number | null => {
  let left = parseFactor(state);
  if (left === null) {
    return null;
  }

  while (true) {
    skipSpaces(state);
    const operator = state.expression[state.index];
    if (operator !== "*" && operator !== "/") {
      break;
    }

    state.index += 1;
    const right = parseFactor(state);
    if (right === null) {
      return null;
    }

    if (operator === "*") {
      left *= right;
    } else {
      if (right === 0) {
        return null;
      }
      left /= right;
    }
  }

  return left;
};

const parseExpressionInternal = (state: ParserState): number | null => {
  let left = parseTerm(state);
  if (left === null) {
    return null;
  }

  while (true) {
    skipSpaces(state);
    const operator = state.expression[state.index];
    if (operator !== "+" && operator !== "-") {
      break;
    }

    state.index += 1;
    const right = parseTerm(state);
    if (right === null) {
      return null;
    }

    if (operator === "+") {
      left += right;
    } else {
      left -= right;
    }
  }

  return left;
};

export const evaluateDiceExpression = (
  expression: string,
  options: DiceEvalOptions = {},
): number | null => {
  const trimmed = expression.trim();
  if (!trimmed) {
    return 0;
  }

  const state: ParserState = {
    expression: trimmed,
    index: 0,
    rollDice: options.rollDice !== false,
  };

  const value = parseExpressionInternal(state);
  if (value === null) {
    return null;
  }

  skipSpaces(state);
  if (state.index !== state.expression.length) {
    return null;
  }

  return value;
};

const toNonNegativeInt = (value: number | null): number => {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
};

const evaluateTurns = (expression: string, rollDice = true): number =>
  toNonNegativeInt(evaluateDiceExpression(expression, { rollDice }));

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
      cooldowns[key].outCombatMinutes <= 0 &&
      cooldowns[key].durationInCombatTurns <= 0 &&
      cooldowns[key].durationOutCombatMinutes <= 0
    ) {
      delete cooldowns[key];
      removedAny = true;
    }
  });

  return removedAny;
};

// Получить все перезарядки из localStorage
export const getAllCooldowns = (): Record<string, CooldownData> => {
  const parsed = parseStoredRecord<Partial<CooldownData>>(STORAGE_KEY);
  const normalized: Record<string, CooldownData> = {};

  Object.entries(parsed).forEach(([key, value]) => {
    normalized[key] = {
      inCombatTurns: value?.inCombatTurns || 0,
      outCombatMinutes: value?.outCombatMinutes || 0,
      durationInCombatTurns: value?.durationInCombatTurns || 0,
      durationOutCombatMinutes: value?.durationOutCombatMinutes || 0,
    };
  });

  return normalized;
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

export const restoreSkillCharges = (
  className: string,
  skillName: string,
  maxCharges: string,
): SkillChargesData | null => {
  const parsedMaxCharges = parseMaxCharges(maxCharges);
  if (parsedMaxCharges === null) {
    return null;
  }

  const restoredCharges: SkillChargesData = {
    current: parsedMaxCharges,
    max: parsedMaxCharges,
  };

  const allCharges = getAllSkillCharges();
  allCharges[getSkillKey(className, skillName)] = restoredCharges;
  saveAllSkillCharges(allCharges);

  return restoredCharges;
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

export const clearSkillCooldownField = (
  className: string,
  skillName: string,
  field:
    | "inCombatTurns"
    | "outCombatMinutes"
    | "durationInCombatTurns"
    | "durationOutCombatMinutes",
) => {
  const cooldowns = getAllCooldowns();
  const key = getSkillKey(className, skillName);
  const currentCooldown = cooldowns[key];

  if (!currentCooldown) {
    return;
  }

  cooldowns[key] = {
    ...currentCooldown,
    [field]: 0,
  };

  if (cleanupExpiredCooldowns(cooldowns)) {
    saveAllCooldowns(cooldowns);
    return;
  }

  saveAllCooldowns(cooldowns);
};

export const setSkillCooldownField = (
  className: string,
  skillName: string,
  field:
    | "inCombatTurns"
    | "outCombatMinutes"
    | "durationInCombatTurns"
    | "durationOutCombatMinutes",
  value: number,
) => {
  const cooldowns = getAllCooldowns();
  const key = getSkillKey(className, skillName);
  const current = cooldowns[key];

  const newEntry: CooldownData = current
    ? { ...current, [field]: Math.max(0, value) }
    : {
        inCombatTurns: 0,
        outCombatMinutes: 0,
        durationInCombatTurns: 0,
        durationOutCombatMinutes: 0,
        [field]: Math.max(0, value),
      };

  cooldowns[key] = newEntry;

  if (cleanupExpiredCooldowns(cooldowns)) {
    saveAllCooldowns(cooldowns);
    return;
  }

  saveAllCooldowns(cooldowns);
};

// Конвертировать строку времени в минуты
export const timeStringToMinutes = (timeStr: string): number => {
  if (!timeStr || timeStr === "-" || timeStr === "∞") return 0;

  const dayMatches = Array.from(
    timeStr.matchAll(/([0-9dD+\-*/().]+)\s*(день|дня|дней|days?)/gi),
  );
  const hourMatches = Array.from(
    timeStr.matchAll(/([0-9dD+\-*/().]+)\s*(час|часа|часов|hours?)/gi),
  );
  const minuteMatches = Array.from(
    timeStr.matchAll(/([0-9dD+\-*/().]+)\s*(минута|минуты|минут|minutes?)/gi),
  );

  let totalMinutes = 0;

  if (
    dayMatches.length > 0 ||
    hourMatches.length > 0 ||
    minuteMatches.length > 0
  ) {
    dayMatches.forEach((match) => {
      totalMinutes += evaluateTurns(match[1]) * 24 * 60;
    });

    hourMatches.forEach((match) => {
      totalMinutes += evaluateTurns(match[1]) * 60;
    });

    minuteMatches.forEach((match) => {
      totalMinutes += evaluateTurns(match[1]);
    });

    return totalMinutes;
  }

  return evaluateTurns(timeStr);
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
  inCombatCooldownTurns: string,
  outCombatCooldown: string,
  inCombatDurationTurns: string,
  outCombatDuration: string,
) => {
  const inCombatTurns = evaluateTurns(inCombatCooldownTurns);
  const hasInCombatCooldown = inCombatTurns > 0;
  const outCombatMinutes = timeStringToMinutes(outCombatCooldown);
  const hasOutCombatCooldown = outCombatMinutes > 0;
  const inCombatDuration = evaluateTurns(inCombatDurationTurns);
  const hasInCombatDuration = inCombatDuration > 0;
  const outCombatDurationMinutes = timeStringToMinutes(outCombatDuration);
  const hasOutCombatDuration = outCombatDurationMinutes > 0;

  if (
    !hasInCombatCooldown &&
    !hasOutCombatCooldown &&
    !hasInCombatDuration &&
    !hasOutCombatDuration
  ) {
    return;
  }

  const currentCooldown = getCooldown(className, skillName);
  setCooldown(className, skillName, {
    inCombatTurns: hasInCombatCooldown
      ? inCombatTurns
      : currentCooldown?.inCombatTurns || 0,
    outCombatMinutes: hasInCombatCooldown
      ? currentCooldown?.outCombatMinutes || 0
      : hasOutCombatCooldown
        ? outCombatMinutes
        : currentCooldown?.outCombatMinutes || 0,
    durationInCombatTurns: hasInCombatDuration
      ? inCombatDuration
      : currentCooldown?.durationInCombatTurns || 0,
    durationOutCombatMinutes: hasInCombatDuration
      ? currentCooldown?.durationOutCombatMinutes || 0
      : hasOutCombatDuration
        ? outCombatDurationMinutes
        : currentCooldown?.durationOutCombatMinutes || 0,
  });
};

// Использовать заклинание вне боя
export const playerUseSkillOutOfCombat = (
  className: string,
  skillName: string,
  inCombatCooldownTurns: string,
  outCombatCooldown: string,
  inCombatDurationTurns: string,
  outCombatDuration: string,
) => {
  const inCombatTurns = evaluateTurns(inCombatCooldownTurns);
  const hasInCombatCooldown = inCombatTurns > 0;
  const outCombatMinutes = timeStringToMinutes(outCombatCooldown);
  const hasOutCombatCooldown = outCombatMinutes > 0;
  const inCombatDuration = evaluateTurns(inCombatDurationTurns);
  const hasInCombatDuration = inCombatDuration > 0;
  const outCombatDurationMinutes = timeStringToMinutes(outCombatDuration);
  const hasOutCombatDuration = outCombatDurationMinutes > 0;

  if (
    !hasInCombatCooldown &&
    !hasOutCombatCooldown &&
    !hasInCombatDuration &&
    !hasOutCombatDuration
  ) {
    return;
  }

  const currentCooldown = getCooldown(className, skillName);
  setCooldown(className, skillName, {
    inCombatTurns: hasOutCombatCooldown
      ? currentCooldown?.inCombatTurns || 0
      : hasInCombatCooldown
        ? inCombatTurns
        : currentCooldown?.inCombatTurns || 0,
    outCombatMinutes: hasOutCombatCooldown
      ? outCombatMinutes
      : currentCooldown?.outCombatMinutes || 0,
    durationInCombatTurns: hasOutCombatDuration
      ? currentCooldown?.durationInCombatTurns || 0
      : hasInCombatDuration
        ? inCombatDuration
        : currentCooldown?.durationInCombatTurns || 0,
    durationOutCombatMinutes: hasOutCombatDuration
      ? outCombatDurationMinutes
      : currentCooldown?.durationOutCombatMinutes || 0,
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

    if (cooldowns[key].durationInCombatTurns > 0) {
      cooldowns[key].durationInCombatTurns -= 1;
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
  const combatTurnsToSkip = minutesToSkip * 10;
  let changed = false;

  Object.keys(cooldowns).forEach((key) => {
    if (cooldowns[key].inCombatTurns > 0) {
      cooldowns[key].inCombatTurns = Math.max(
        0,
        cooldowns[key].inCombatTurns - combatTurnsToSkip,
      );
      changed = true;
    }

    if (cooldowns[key].durationInCombatTurns > 0) {
      cooldowns[key].durationInCombatTurns = Math.max(
        0,
        cooldowns[key].durationInCombatTurns - combatTurnsToSkip,
      );
      changed = true;
    }

    if (cooldowns[key].outCombatMinutes > 0) {
      cooldowns[key].outCombatMinutes = Math.max(
        0,
        cooldowns[key].outCombatMinutes - minutesToSkip,
      );
      changed = true;
    }

    if (cooldowns[key].durationOutCombatMinutes > 0) {
      cooldowns[key].durationOutCombatMinutes = Math.max(
        0,
        cooldowns[key].durationOutCombatMinutes - minutesToSkip,
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
