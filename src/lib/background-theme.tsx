import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const BACKGROUND_THEMES = [
  {
    id: "default",
    label: "Clássico",
    swatch: "oklch(0.16 0.03 295)",
  },
  {
    id: "grid",
    label: "Grade Cyberpunk",
    swatch:
      "linear-gradient(180deg, #0a0118 0%, #2a0845 55%, #ff2ea6 56%, #0a0118 100%)",
  },
  {
    id: "nebula",
    label: "Nebulosa 3D",
    swatch:
      "radial-gradient(circle at 30% 30%, #7c3aed, transparent 60%), radial-gradient(circle at 70% 60%, #06b6d4, transparent 60%), #05040d",
  },
  {
    id: "holo",
    label: "Holográfico",
    swatch:
      "linear-gradient(120deg, #ff2ea6, #7c3aed, #06b6d4, #22d3ee, #ff2ea6)",
  },
] as const;

export type BackgroundThemeId = (typeof BACKGROUND_THEMES)[number]["id"];

const STORAGE_KEY = "topdj-bg-theme";
const DEFAULT_THEME: BackgroundThemeId = "default";

type BackgroundThemeContextValue = {
  theme: BackgroundThemeId;
  setTheme: (theme: BackgroundThemeId) => void;
};

const BackgroundThemeContext = createContext<BackgroundThemeContextValue | null>(null);

export function BackgroundThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<BackgroundThemeId>(DEFAULT_THEME);

  // Lê a preferência salva assim que o app monta no navegador.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const isValid = BACKGROUND_THEMES.some((t) => t.id === stored);
    if (stored && isValid) {
      setThemeState(stored as BackgroundThemeId);
    }
  }, []);

  // Aplica o tema atual como atributo no <html> para o CSS reagir.
  useEffect(() => {
    document.documentElement.setAttribute("data-bg-theme", theme);
  }, [theme]);

  function setTheme(next: BackgroundThemeId) {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <BackgroundThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </BackgroundThemeContext.Provider>
  );
}

export function useBackgroundTheme() {
  const ctx = useContext(BackgroundThemeContext);
  if (!ctx) {
    throw new Error("useBackgroundTheme deve ser usado dentro de BackgroundThemeProvider");
  }
  return ctx;
}
