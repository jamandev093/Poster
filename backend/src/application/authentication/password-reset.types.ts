export interface RequestPasswordResetInput {
  email: string;

  ipAddress?:
    | string
    | null;

  userAgent?:
    | string
    | null;
}

export interface RequestPasswordResetResult {
  status:
    "accepted";
}

export interface ConfirmPasswordResetInput {
  email: string;

  code: string;

  password: string;
}

export interface ConfirmPasswordResetResult {
  status:
    "password_updated";
}