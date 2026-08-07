import type {
  UserIdentityRecord,
} from "../../domains/identity/index.js";

export interface DeleteAccountInput {
  userId: string;
}

export interface DeleteAccountResult {
  account: UserIdentityRecord;

  deletedAt: Date;

  revokedSessionCount: number;
}
