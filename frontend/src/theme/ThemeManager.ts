export type ThemeMode =
  | "system"
  | "light"
  | "dark";

type ThemeListener = (
  theme: ThemeMode
) => void;

let currentTheme: ThemeMode =
  "system";

const listeners =
  new Set<ThemeListener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    listener(currentTheme);
  });
}

const ThemeManager = {
  getTheme(): ThemeMode {
    return currentTheme;
  },

  setTheme(theme: ThemeMode): void {
    if (theme === currentTheme) {
      return;
    }

    currentTheme = theme;
    notifyListeners();
  },

  subscribe(
    listener: ThemeListener
  ): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export default ThemeManager;