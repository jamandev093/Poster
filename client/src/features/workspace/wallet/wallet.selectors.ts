import {
  mockAdvertiserWallet,
} from "./wallet.mock";

import {
  createWalletSummary,
} from "./wallet.types";

import type {
  AdvertiserWallet,
  WalletSummary,
} from "./wallet.types";

export function getCurrentAdvertiserWallet():
  AdvertiserWallet {
  return mockAdvertiserWallet;
}

export function getCurrentWalletSummary():
  WalletSummary {
  return createWalletSummary(
    getCurrentAdvertiserWallet()
  );
}