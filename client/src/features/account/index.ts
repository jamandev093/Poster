export { default as AccountManager } from "./AccountManager";
export { default } from "./AccountManager";

export {
  useClientAccount,
} from "./useClientAccount";

export type {
  UseClientAccountResult,
} from "./useClientAccount";

export {
  getClientAccount,
  getClientCurrentOrganization,
  updateClientCurrentOrganization,
} from "./client-account.service";

export type {
  ClientAccount,
  ClientAccountOrganization,
  ClientAccountUser,
  UpdateClientOrganizationInput,
} from "./client-account.service";