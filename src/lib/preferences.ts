import { createContext, useContext } from "react";
export type Preferences = { glass: boolean; glassPreset: "Subtle" | "Balanced" | "Clear"; density: "comfortable" | "compact"; textSize: "standard" | "large"; newsAlerts: boolean; aiAlerts: boolean; currency: string; importZone: string };
export const defaults: Preferences = { glass: false, glassPreset: "Subtle", density: "comfortable", textSize: "standard", newsAlerts: true, aiAlerts: true, currency: "USD", importZone: "America/New_York" };
export const PreferencesContext = createContext<{ preferences: Preferences; update: (patch: Partial<Preferences>) => void }>({ preferences: defaults, update: () => {} });
export const usePreferences = () => useContext(PreferencesContext);