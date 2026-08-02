import React, {
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  useColorScheme,
} from "react-native";

import { ThemeContext } from "./ThemeContext";

import { LightTheme } from "./light";
import { DarkTheme } from "./dark";

import ThemeManager from "./ThemeManager";

type Props = {
  children: React.ReactNode;
};

export default function ThemeProvider({
  children,
}: Props) {
  const systemTheme =
    useColorScheme();

  const mode =
    useSyncExternalStore(
      ThemeManager.subscribe,
      ThemeManager.getTheme,
      ThemeManager.getTheme
    );

  const theme = useMemo(() => {
    if (mode === "dark") {
      return DarkTheme;
    }

    if (mode === "light") {
      return LightTheme;
    }

    return systemTheme === "dark"
      ? DarkTheme
      : LightTheme;
  }, [
    mode,
    systemTheme,
  ]);

  return (
    <ThemeContext.Provider
      value={theme}
    >
      {children}
    </ThemeContext.Provider>
  );
}