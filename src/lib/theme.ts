export const ACCENT = "#ef4444";
export const ACCENT_DIM = "#7f1d1d";

export function applyTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--accent-color", ACCENT);
  root.style.setProperty("--neon", ACCENT);
  root.style.setProperty("--neon-dim", ACCENT_DIM);
  root.style.setProperty("--primary", ACCENT);
  root.style.setProperty("--ring", ACCENT);
  root.style.setProperty("--border", ACCENT);
  root.style.setProperty("--shadow-neon", "none");
  root.style.setProperty("--shadow-neon-sm", "none");
}

export function initThemeFromStorage() {
  applyTheme();
}
