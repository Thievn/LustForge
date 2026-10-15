import type { ReactNode } from "react";
import { useEffect } from "react";

/** Single boudoir theme. The light/dark toggle is gone. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.style.colorScheme = "dark";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#1B1620");
    try {
      window.localStorage.removeItem("lustforge-theme");
    } catch {
      /* private mode */
    }
  }, []);

  return <>{children}</>;
}
