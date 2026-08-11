import { browserStorage } from "@/repositories/LocalStorageRepository";
import type { CartItem, ID, Language, Theme } from "@/types/domain";

const keys = {
  cart: "tc2:v1:cart",
  favorites: "tc2:v1:favorites",
  recent: "tc2:v1:recent",
  language: "tc2:v1:language",
  theme: "tc2:v1:theme",
};

const read = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(browserStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
};

export const preferenceService = {
  getCart: () => read<CartItem[]>(keys.cart, []),
  setCart: (items: CartItem[]) => browserStorage.setItem(keys.cart, JSON.stringify(items)),
  getFavorites: () => read<ID[]>(keys.favorites, []),
  setFavorites: (items: ID[]) => browserStorage.setItem(keys.favorites, JSON.stringify(items)),
  getRecent: () => read<ID[]>(keys.recent, []),
  setRecent: (items: ID[]) => browserStorage.setItem(keys.recent, JSON.stringify(items.slice(0, 8))),
  getLanguage: () => read<Language>(keys.language, "ru"),
  setLanguage: (language: Language) => browserStorage.setItem(keys.language, JSON.stringify(language)),
  getTheme: () => read<Theme>(keys.theme, "light"),
  setTheme: (theme: Theme) => browserStorage.setItem(keys.theme, JSON.stringify(theme)),
};
