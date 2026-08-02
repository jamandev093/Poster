import { createContext } from "react";

import { LightTheme } from "./light";
import { Theme } from "./types";

export const ThemeContext =
  createContext<Theme>(LightTheme);