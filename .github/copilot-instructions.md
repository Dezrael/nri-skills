# API Documentation

Base URL: `https://nri-server.vercel.app/api/v1`

Все успешные ответы приходят в формате:

```typescript
{
  data: T;
}
```

## TypeScript Types

```typescript
interface Skill {
  id: number;
  className: string;
  name: string;
  actionType: string;
  range: string;
  stat: string;
  durationInCombat: string;
  durationOutOfCombat: string;
  damage: string;
  inCombatCooldown: string;
  outCombatCooldown: string;
  outCombatCharges: string;
  cooldownType?: string;
  savingThrow?: string;
  category: string;
  shortDescription: string;
  description: string;
  concentration: boolean;
  isChosen: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Passive {
  id: number;
  className: string;
  name: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface Mushroom {
  id: number;
  className: string;
  name: string;
  baseEffect: string;
  activationEffect: string;
  summonEffect: string;
  aspectEffect: string;
  createdAt: string;
  updatedAt: string;
}
```

## Public Endpoints (for UI output)

### GET /api/v1/classes

Получить список всех классов.

**Response:** `{ data: string[] }`

**Example:**

```typescript
const response = await fetch("https://nri-server.vercel.app/api/v1/classes");
const { data } = await response.json(); // data: string[]
```

### GET /api/v1/classes/:className/skills

Получить все скиллы указанного класса.

**Response:** `{ data: Skill[] }`

**Example:**

```typescript
const className = encodeURIComponent("Маг");
const response = await fetch(
  `https://nri-server.vercel.app/api/v1/classes/${className}/skills`,
);
const { data } = await response.json(); // data: Skill[]
```

### GET /api/v1/classes/:className/passives

Получить все пассивки указанного класса.

**Response:** `{ data: Passive[] }`

**Example:**

```typescript
const className = encodeURIComponent("Воин");
const response = await fetch(
  `https://nri-server.vercel.app/api/v1/classes/${className}/passives`,
);
const { data } = await response.json(); // data: Passive[]
```

### GET /api/v1/classes/:className/mushrooms

Получить все грибы указанного класса.

Если у класса грибов нет, API возвращает пустой массив.

**Response:** `{ data: Mushroom[] }`

**Example:**

```typescript
const className = encodeURIComponent("Разбойник");
const response = await fetch(
  `https://nri-server.vercel.app/api/v1/classes/${className}/mushrooms`,
);
const { data } = await response.json(); // data: []
```

## Admin Endpoints (edit/delete selected items)

Все admin endpoint'ы требуют заголовок:

`Authorization: Bearer <token>`

### POST /api/v1/auth/login

Получить admin token по паролю.

**Body:**

```typescript
{
  password: string;
}
```

**Response:**

```typescript
{
  data: {
    token: string;
  }
}
```

### POST /api/v1/auth/bulk-import

Заменить все данные в БД (skills, passives, mushrooms) на данные из экспортированного JSON.

Требует admin token в заголовке `Authorization: Bearer <token>`.

**Body:**

```typescript
{
  exportedAt: string;
  source: string;
  data: Record<
    string,
    {
      skills: Array<
        Omit<Skill, "id" | "createdAt" | "updatedAt"> &
          Partial<Pick<Skill, "id" | "createdAt" | "updatedAt">>
      >;
      passives: Array<
        Omit<Passive, "id" | "createdAt" | "updatedAt"> &
          Partial<Pick<Passive, "id" | "createdAt" | "updatedAt">>
      >;
      mushrooms: Array<
        Omit<Mushroom, "id" | "createdAt" | "updatedAt"> &
          Partial<Pick<Mushroom, "id" | "createdAt" | "updatedAt">>
      >;
    }
  >;
}
```

**Response:**

```typescript
{
  data: {
    importedAt: string;
    source: string;
    classes: number;
    skills: number;
    passives: number;
    mushrooms: number;
  }
}
```

### POST /api/v1/classes

Создать новый класс. Массивы `skills`, `passives`, `mushrooms` опциональны.
Если какой-то массив не передан, сервер использует пустой массив.

**Body:**

```typescript
{
  className: string;
  skills?: Array<Omit<Skill, "id" | "className" | "createdAt" | "updatedAt">>;
  passives?: Array<Omit<Passive, "id" | "className" | "createdAt" | "updatedAt">>;
  mushrooms?: Array<Omit<Mushroom, "id" | "className" | "createdAt" | "updatedAt">>;
}
```

**Response:**

```typescript
{
  data: {
    className: string;
    skills: number;
    passives: number;
    mushrooms: number;
  }
}
```

### DELETE /api/v1/classes/:className

Удалить класс и все связанные записи в `skills`, `passives`, `mushrooms`.

**Response:**

```typescript
{
  data: {
    className: string;
    skills: number;
    passives: number;
    mushrooms: number;
  }
}
```

### PUT /api/v1/skills/:id

Изменить выбранный скилл.

**Body (partial):**

```typescript
Partial<
  Pick<
    Skill,
    | "className"
    | "name"
    | "actionType"
    | "range"
    | "stat"
    | "durationInCombat"
    | "durationOutOfCombat"
    | "damage"
    | "inCombatCooldown"
    | "outCombatCooldown"
    | "outCombatCharges"
    | "cooldownType"
    | "savingThrow"
    | "category"
    | "shortDescription"
    | "description"
    | "concentration"
    | "isChosen"
  >
>;
```

**Response:** `{ data: Skill }`

### PUT /api/v1/passives/:id

Изменить выбранную пассивку.

**Body (partial):**

```typescript
Partial<Pick<Passive, "className" | "name" | "text">>;
```

**Response:** `{ data: Passive }`

### PUT /api/v1/mushrooms/:id

Изменить выбранный гриб.

**Body (partial):**

```typescript
Partial<
  Pick<
    Mushroom,
    | "className"
    | "name"
    | "baseEffect"
    | "activationEffect"
    | "summonEffect"
    | "aspectEffect"
  >
>;
```

**Response:** `{ data: Mushroom }`

### DELETE /api/v1/skills/:id

Удалить выбранный скилл.

**Response:** `204 No Content`

### DELETE /api/v1/passives/:id

Удалить выбранную пассивку.

**Response:** `204 No Content`

### DELETE /api/v1/mushrooms/:id

Удалить выбранный гриб.

**Response:** `204 No Content`

## Optional Admin Create Endpoints

### POST /api/v1/skills

Создать скилл.

### POST /api/v1/passives

Создать пассивку.

### POST /api/v1/mushrooms

Создать гриб.

## Error Format

```typescript
{
  error: string;
  details?: unknown;
}
```

HTTP status codes:

- `200` success
- `201` created
- `204` deleted
- `400` validation error
- `404` not found
- `500` internal server error
