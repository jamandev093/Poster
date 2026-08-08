export interface MobileAdvertisingPreferences {
  userId:
    string;

  personalizedAdsEnabled:
    boolean;

  hiddenItemIds:
    string[];

  createdAt:
    string | null;

  updatedAt:
    string | null;
}

export interface GetMobileAdvertisingPreferencesInput {
  userId:
    string;
}

export interface SetPersonalizedAdsEnabledInput {
  userId:
    string;

  enabled:
    boolean;
}

export interface HideMobileAdvertisingItemInput {
  userId:
    string;

  itemId:
    string;
}

export interface UnhideMobileAdvertisingItemInput {
  userId:
    string;

  itemId:
    string;
}

export interface ClearMobileAdvertisingHiddenItemsInput {
  userId:
    string;
}

export interface ResetMobileAdvertisingPreferencesInput {
  userId:
    string;
}

export interface MobileAdvertisingPreferencesRepository {
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
