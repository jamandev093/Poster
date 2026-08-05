import {
  createClientAccountService,
} from "./client-account.service.js";

export function createProductionClientAccountService() {
  return createClientAccountService();
}