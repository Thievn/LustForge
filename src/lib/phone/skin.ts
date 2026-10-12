export const PHONE_SKINS = [
  { id: "lustforge", label: "LustForge" },
  { id: "ios_light", label: "iOS light" },
  { id: "ios_dark", label: "iOS dark" },
  { id: "android", label: "Android" },
  { id: "forge_noir", label: "Forge Noir" },
] as const;

export type PhoneSkinId = (typeof PHONE_SKINS)[number]["id"];

const KEY = "lustforge-phone-skin";

export function readPhoneSkin(): PhoneSkinId {
  try {
    const value = localStorage.getItem(KEY);
    if (PHONE_SKINS.some((skin) => skin.id === value)) return value as PhoneSkinId;
  } catch {
    /* ignore */
  }
  return "lustforge";
}

export function writePhoneSkin(id: PhoneSkinId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}
