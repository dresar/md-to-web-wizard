import { useEffect } from "react";
import { useBioStore } from "@/lib/store";

/**
 * Applies accent + light/dark class to <html> based on store state.
 * Client-only side-effect component; renders nothing.
 */
export function ThemeManager() {
  const accent = useBioStore((s) => s.settings.accent);
  const theme = useBioStore((s) => s.settings.theme);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-accent", accent);
    if (theme === "light") html.classList.add("light");
    else html.classList.remove("light");
  }, [accent, theme]);

  return null;
}
