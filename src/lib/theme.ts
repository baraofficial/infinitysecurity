export type ThemeKey = "purple" | "green" | "blue";

export const THEME_COLORS: Record<ThemeKey, string> = {
  purple: "#a855f7",
  green: "#22c55e",
  blue: "#3b82f6",
};

// dimmer variants for --neon-dim
const DIM: Record<ThemeKey, string> = {
  purple: "#6b21a8",
  green: "#15803d",
  blue: "#1d4ed8",
};

export function applyTheme(t: ThemeKey) {
  const color = THEME_COLORS[t] ?? THEME_COLORS.purple;
  const dim = DIM[t] ?? DIM.purple;
  const root = document.documentElement;
  root.style.setProperty("--accent-color", color);
  root.style.setProperty("--neon", color);
  root.style.setProperty("--neon-dim", dim);
  root.style.setProperty("--primary", color);
  root.style.setProperty("--ring", color);
  root.style.setProperty("--border", color);
  root.style.setProperty(
    "--shadow-neon",
    `0 0 12px ${color}99`,
  );
  root.style.setProperty(
    "--shadow-neon-sm",
    `0 0 6px ${color}66`,
  );
}

export function initThemeFromStorage() {
  if (typeof window === "undefined") return;
  const t = (localStorage.getItem("theme") as ThemeKey) || "purple";
  applyTheme(THEME_COLORS[t] ? t : "purple");
}
