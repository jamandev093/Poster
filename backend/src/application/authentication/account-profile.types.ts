export interface AccountProfileResponse {
  account: {
    id: string;

    email: string;

    fullName: string;

    status: string;

    emailVerifiedAt: string | null;

    createdAt: string;

    updatedAt: string;

    rowVersion: string;
  };
}

export interface GetAccountProfileInput {
  userId: string;
}

export interface UpdateAccountProfileInput {
  userId: string;

  fullName: string;
}
