import type {
  ClearMobileAdvertisingHiddenItemsInput,
  GetMobileAdvertisingPreferencesInput,
  HideMobileAdvertisingItemInput,
  MobileAdvertisingPreferences,
  MobileAdvertisingPreferencesRepository,
  ResetMobileAdvertisingPreferencesInput,
  SetPersonalizedAdsEnabledInput,
  UnhideMobileAdvertisingItemInput,
} from "../../domains/mobile-advertising-preferences/index.js";

export interface MobileAdvertisingPreferencesService {
  getPreferences(
    input:
      GetMobileAdvertisingPreferencesInput
  ): Promise<MobileAdvertisingPreferences>;

  setPersonalizedAdsEnabled(
    input:
      SetPersonalizedAdsEnabledInput
  ): Promise<MobileAdvertisingPreferences>;

  hideItem(
    input:
      HideMobileAdvertisingItemInput
  ): Promise<MobileAdvertisingPreferences>;

  unhideItem(
    input:
      UnhideMobileAdvertisingItemInput
  ): Promise<MobileAdvertisingPreferences>;

  clearHiddenItems(
    input:
      ClearMobileAdvertisingHiddenItemsInput
  ): Promise<MobileAdvertisingPreferences>;

  resetPreferences(
    input:
      ResetMobileAdvertisingPreferencesInput
  ): Promise<MobileAdvertisingPreferences>;
}

function normalizeRequiredText(
  value:
    string,
  fieldName:
    string,
  maximumLength =
    256
): string {
  const normalized =
    value
      .trim()
      .replace(/\s+/g, " ");

  if (!normalized) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  if (
    normalized.length >
    maximumLength
  ) {
    throw new Error(
      `${fieldName} must be ${maximumLength} characters or fewer.`
    );
  }

  return normalized;
}

function normalizeUserId(
  userId:
    string
): string {
  return normalizeRequiredText(
    userId,
    "User id"
  );
}

function normalizeItemId(
  itemId:
    string
): string {
  return normalizeRequiredText(
    itemId,
    "Hidden monetization item id"
  );
}

class DefaultMobileAdvertisingPreferencesService
implements MobileAdvertisingPreferencesService {
  constructor(
    private readonly repository:
      MobileAdvertisingPreferencesRepository
  ) {}

  async getPreferences(
    input:
      GetMobileAdvertisingPreferencesInput
  ): Promise<MobileAdvertisingPreferences> {
    return this.repository.getPreferences({
      userId:
        normalizeUserId(
          input.userId
        ),
    });
  }

  async setPersonalizedAdsEnabled(
    input:
      SetPersonalizedAdsEnabledInput
  ): Promise<MobileAdvertisingPreferences> {
    return this.repository.setPersonalizedAdsEnabled({
      userId:
        normalizeUserId(
          input.userId
        ),

      enabled:
        Boolean(
          input.enabled
        ),
    });
  }

  async hideItem(
    input:
      HideMobileAdvertisingItemInput
  ): Promise<MobileAdvertisingPreferences> {
    return this.repository.hideItem({
      userId:
        normalizeUserId(
          input.userId
        ),

      itemId:
        normalizeItemId(
          input.itemId
        ),
    });
  }

  async unhideItem(
    input:
      UnhideMobileAdvertisingItemInput
  ): Promise<MobileAdvertisingPreferences> {
    return this.repository.unhideItem({
      userId:
        normalizeUserId(
          input.userId
        ),

      itemId:
        normalizeItemId(
          input.itemId
        ),
    });
  }

  async clearHiddenItems(
    input:
      ClearMobileAdvertisingHiddenItemsInput
  ): Promise<MobileAdvertisingPreferences> {
    return this.repository.clearHiddenItems({
      userId:
        normalizeUserId(
          input.userId
        ),
    });
  }

  async resetPreferences(
    input:
      ResetMobileAdvertisingPreferencesInput
  ): Promise<MobileAdvertisingPreferences> {
    return this.repository.resetPreferences({
      userId:
        normalizeUserId(
          input.userId
        ),
    });
  }
}

export function createMobileAdvertisingPreferencesService(
  repository:
    MobileAdvertisingPreferencesRepository
): MobileAdvertisingPreferencesService {
  return new DefaultMobileAdvertisingPreferencesService(
    repository
  );
}
