export type PlayerSkill = {
  id?: number;
  className?: string;
  name: string; // название
  actionType: string; // тип действия (основное/дополнительное и т.д.)
  range: string; // дальность
  stat: string; // характеристика (сила/ловкость/интеллект и т.д.)
  duration: string; // длительность
  damage: string; // урон или исцеление (например 20+d12)
  inCombatCooldown: string; // перезарядка в бою (количество ходов)
  outCombatCooldown: string; // перезарядка вне боя (любое время: 1 час, 5 минут и т.д.)
  outCombatCharges: string; // количество использований до перезарядки
  shortDescription: string; // краткое описание
  description: string; // полное описание
  concentration: boolean; // требует ли концентрации
  isChosen: boolean; // взял ли игрок заклинание себе
  createdAt?: string;
  updatedAt?: string;
};

export type PassiveAbility = {
  id?: number;
  className?: string;
  name: string; // название
  text: string; // текст описания
  createdAt?: string;
  updatedAt?: string;
};

export type Mushroom = {
  id?: number;
  className?: string;
  name: string; // название
  baseEffect: string; // описание базового эффекта гриба
  activationEffect: string; // описание эффекта активации гриба (например взрыв)
  summonEffect: string; // описание того, что будет представлять из себя гриб, если призвать его как саммона
  aspectEffect: string; // описание того, что будет если грибомант решит перенять свойства гриба
  createdAt?: string;
  updatedAt?: string;
};

export type SkillsDatabase = {
  [className: string]: {
    skills: PlayerSkill[];
    passives: PassiveAbility[];
    mushrooms?: Mushroom[]; // опционально, только для Грибоманта
  };
};
