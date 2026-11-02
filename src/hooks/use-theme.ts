import { useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => setDark(localStorage.getItem("theme") !== "light"), []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  return { dark, toggle };
}
