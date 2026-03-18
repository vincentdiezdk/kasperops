import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("kasperops-theme");
      if (stored === "dark" || stored === "light") return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("kasperops-theme", theme);
  }, [theme]);

  const toggleTheme = () => setThemeState(prev => prev === "light" ? "dark" : "light");
  const setTheme = (t: "light" | "dark") => setThemeState(t);

  return { theme, toggleTheme, setTheme };
}
