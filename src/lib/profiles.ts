export interface Profile {
  id: string;
  name: string;
}

/** Perfis pré-configurados. Cada um tem seu próprio espaço de dados isolado no localStorage. */
export const PROFILES: Profile[] = [
  { id: "joao", name: "João" },
  { id: "kakau", name: "Kakau" },
];

const ACTIVE_PROFILE_KEY = "gfi-active-profile";

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function clearActiveProfileId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

/** Prefixa uma chave de storage com o perfil ativo, para isolar os dados de cada pessoa. */
export function profileScopedKey(baseKey: string): string {
  const profileId = getActiveProfileId();
  return profileId ? `${baseKey}::${profileId}` : `${baseKey}::__sem_perfil__`;
}

export function getProfileName(id: string): string {
  return PROFILES.find((p) => p.id === id)?.name ?? id;
}
