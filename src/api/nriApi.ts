import {
  Mushroom,
  PassiveAbility,
  PlayerSkill,
  SkillsDatabase,
} from "../types/PlayerSkill";

const API_BASE = "https://nri-server.vercel.app/api/v1";

type ApiResponse<T> = { data: T };

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, init);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // Ignore non-json errors and use default message
    }
    throw new Error(message);
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

export const createSkill = (payload: Omit<PlayerSkill, "id">) =>
  fetchJson<PlayerSkill>("/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateSkill = (id: number, payload: Partial<PlayerSkill>) =>
  fetchJson<PlayerSkill>(`/skills/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deleteSkill = (id: number) =>
  fetchJson<void>(`/skills/${id}`, { method: "DELETE" });

export const createPassive = (payload: Omit<PassiveAbility, "id">) =>
  fetchJson<PassiveAbility>("/passives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updatePassive = (id: number, payload: Partial<PassiveAbility>) =>
  fetchJson<PassiveAbility>(`/passives/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deletePassive = (id: number) =>
  fetchJson<void>(`/passives/${id}`, { method: "DELETE" });

export const createMushroom = (payload: Omit<Mushroom, "id">) =>
  fetchJson<Mushroom>("/mushrooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateMushroom = (id: number, payload: Partial<Mushroom>) =>
  fetchJson<Mushroom>(`/mushrooms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deleteMushroom = (id: number) =>
  fetchJson<void>(`/mushrooms/${id}`, { method: "DELETE" });
