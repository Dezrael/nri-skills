import {
  Mushroom,
  PassiveAbility,
  PlayerSkill,
  SkillsDatabase,
} from "../types/PlayerSkill";

const API_BASE = "https://nri-server.vercel.app/api/v1";

type ApiResponse<T> = { data: T };
type AuthTokenResponse = { token: string };

type BulkImportPayload = {
  exportedAt: string;
  source: string;
  data: SkillsDatabase;
};

type BulkImportResult = {
  importedAt: string;
  source: string;
  classes: number;
  skills: number;
  passives: number;
  mushrooms: number;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

const stringifyErrorDetails = (details: unknown): string | null => {
  if (details == null) {
    return null;
  }

  if (typeof details === "string") {
    return details;
  }

  if (Array.isArray(details)) {
    const parts = details
      .map((item) => stringifyErrorDetails(item))
      .filter((item): item is string => Boolean(item && item.trim()));
    return parts.length ? parts.join("; ") : null;
  }

  if (typeof details === "object") {
    const record = details as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    const values = Object.values(record)
      .map((value) => stringifyErrorDetails(value))
      .filter((value): value is string => Boolean(value && value.trim()));

    return values.length ? values.join("; ") : null;
  }

  return String(details);
};

const withAuthHeader = (token: string, init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return {
    ...init,
    headers,
  };
};

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, init);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      const detailsText = stringifyErrorDetails(errorBody?.details);

      if (detailsText) {
        message = detailsText;
      }

      if (errorBody?.error) {
        message = detailsText ? `${detailsText}` : errorBody.error;
      }
    } catch {
      // Ignore non-json errors and use default message
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
};

export const fetchClasses = () => fetchJson<string[]>("/classes");

export const fetchClassSkills = (className: string) =>
  fetchJson<PlayerSkill[]>(`/classes/${encodeURIComponent(className)}/skills`);

export const fetchClassPassives = (className: string) =>
  fetchJson<PassiveAbility[]>(
    `/classes/${encodeURIComponent(className)}/passives`,
  );

export const fetchClassMushrooms = (className: string) =>
  fetchJson<Mushroom[]>(`/classes/${encodeURIComponent(className)}/mushrooms`);

export const fetchAllSkillsData = async (): Promise<SkillsDatabase> => {
  const classes = await fetchClasses();

  const entries = await Promise.all(
    classes.map(async (className) => {
      const [skills, passives, mushrooms] = await Promise.all([
        fetchClassSkills(className),
        fetchClassPassives(className),
        fetchClassMushrooms(className),
      ]);

      return [
        className,
        {
          skills,
          passives,
          mushrooms,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries);
};

export const loginAdmin = (password: string) =>
  fetchJson<AuthTokenResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

export const bulkImportData = (payload: BulkImportPayload, token: string) =>
  fetchJson<BulkImportResult>(
    "/auth/bulk-import",
    withAuthHeader(token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

export const createSkill = (payload: Omit<PlayerSkill, "id">, token: string) =>
  fetchJson<PlayerSkill>(
    "/skills",
    withAuthHeader(token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

export const updateSkill = (
  id: number,
  payload: Partial<PlayerSkill>,
  token: string,
) =>
  fetchJson<PlayerSkill>(
    `/skills/${id}`,
    withAuthHeader(token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

export const deleteSkill = (id: number, token: string) =>
  fetchJson<void>(`/skills/${id}`, withAuthHeader(token, { method: "DELETE" }));

export const createPassive = (
  payload: Omit<PassiveAbility, "id">,
  token: string,
) =>
  fetchJson<PassiveAbility>(
    "/passives",
    withAuthHeader(token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

export const updatePassive = (
  id: number,
  payload: Partial<PassiveAbility>,
  token: string,
) =>
  fetchJson<PassiveAbility>(
    `/passives/${id}`,
    withAuthHeader(token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

export const deletePassive = (id: number, token: string) =>
  fetchJson<void>(
    `/passives/${id}`,
    withAuthHeader(token, { method: "DELETE" }),
  );

export const createMushroom = (payload: Omit<Mushroom, "id">, token: string) =>
  fetchJson<Mushroom>(
    "/mushrooms",
    withAuthHeader(token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

export const updateMushroom = (
  id: number,
  payload: Partial<Mushroom>,
  token: string,
) =>
  fetchJson<Mushroom>(
    `/mushrooms/${id}`,
    withAuthHeader(token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

export const deleteMushroom = (id: number, token: string) =>
  fetchJson<void>(
    `/mushrooms/${id}`,
    withAuthHeader(token, { method: "DELETE" }),
  );

type ClassResult = {
  className: string;
  skills: number;
  passives: number;
  mushrooms: number;
};

export const createClass = (className: string, token: string) =>
  fetchJson<ClassResult>(
    "/classes",
    withAuthHeader(token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        className,
        skills: [],
        passives: [],
        mushrooms: [],
      }),
    }),
  );

export const deleteClass = (className: string, token: string) =>
  fetchJson<ClassResult>(
    `/classes/${encodeURIComponent(className)}`,
    withAuthHeader(token, { method: "DELETE" }),
  );
