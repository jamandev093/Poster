export interface ThemeColors {
  readonly primary: string;
  readonly onPrimary: string;

  readonly background: string;
  readonly surface: string;
  readonly card: string;
  readonly border: string;

  readonly text: string;
  readonly textSecondary: string;
  readonly icon: string;

  readonly danger: string;
  readonly success: string;
  readonly warning: string;

  readonly skeleton: string;
  readonly placeholder: string;
  readonly overlay: string;
  readonly sponsored: string;
}

export interface Theme {
  readonly dark: boolean;
  readonly colors: ThemeColors;
}