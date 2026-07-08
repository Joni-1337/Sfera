"use client";

import { useLayoutEffect } from "react";

export type UiTheme = "dark" | "light";

export function ThemeProvider({
  theme,
  children,
}: {
  theme: UiTheme;
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <>{children}</>;
}
