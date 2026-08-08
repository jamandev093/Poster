import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createMobileAdvertisingPreferencesService,
  type MobileAdvertisingPreferencesService,
} from "../src/application/mobile-advertising-preferences/index.js";

import type {
  ClearMobileAdvertisingHiddenItemsInput,
  GetMobileAdvertisingPreferencesInput,
  HideMobileAdvertisingItemInput,
  MobileAdvertisingPreferences,
  MobileAdvertisingPreferencesRepository,
  ResetMobileAdvertisingPreferencesInput,
  SetPersonalizedAdsEnabledInput,
  UnhideMobileAdvertisingItemInput,
} from "../src/domains/mobile-advertising-preferences/index.js";

const USER_ID =
  "11111111-1111-4111-8111-111111111111";

function clonePreferences(
  preferences:
    MobileAdvertisingPreferences
): MobileAdvertisingPreferences {
  return {
    ...preferences,

    hiddenItemIds:
      [
        ...preferences.hiddenItemIds,
      ],
  };
}

class InMemoryMobileAdvertisingPreferencesRepository
implements MobileAdvertisingPreferencesRepository {
  private readonly preferencesByUserId =
    new Map<string, MobileAdvertisingPreferences>();

  private createDefaultPreferences(
    userId:
      string
  ): MobileAdvertisingPreferences {
    const timestamp =
      new Date(0).toISOString();

    return {
      userId,

      personalizedAdsEnabled:
        false,

      hiddenItemIds:
        [],

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };
  }

  private getOrCreatePreferences(
    userId:
      string
  ): MobileAdvertisingPreferences {
    const existing =
      this.preferencesByUserId.get(
        userId
      );

    if (existing) {
      return existing;
    }

    const nextPreferences =
      this.createDefaultPreferences(
        userId
      );

    this.preferencesByUserId.set(
      userId,
      nextPreferences
    );

    return nextPreferences;
  }

  private touch(
    preferences:
      MobileAdvertisingPreferences
  ): MobileAdvertisingPreferences {
    preferences.updatedAt =
      new Date(1000).toISOString();

    return clonePreferences(
      preferences
    );
  }

  async getPreferences(
    input:
      GetMobileAdvertisingPreferencesInput
  ): Promise<MobileAdvertisingPreferences> {
    return clonePreferences(
      this.getOrCreatePreferences(
        input.userId
      )
    );
  }

  async setPersonalizedAdsEnabled(
    input:
      SetPersonalizedAdsEnabledInput
  ): Promise<MobileAdvertisingPreferences> {
    const preferences =
      this.getOrCreatePreferences(
        input.userId
      );

    preferences.personalizedAdsEnabled =
      input.enabled;

    return this.touch(
      preferences
    );
  }

  async hideItem(
    input:
      HideMobileAdvertisingItemInput
  ): Promise<MobileAdvertisingPreferences> {
    const preferences =
      this.getOrCreatePreferences(
        input.userId
      );

    if (
      !preferences.hiddenItemIds.includes(
        input.itemId
      )
    ) {
      preferences.hiddenItemIds.push(
        input.itemId
      );
    }

    return this.touch(
      preferences
    );
  }

  async unhideItem(
    input:
      UnhideMobileAdvertisingItemInput
  ): Promise<MobileAdvertisingPreferences> {
    const preferences =
      this.getOrCreatePreferences(
        input.userId
      );

    preferences.hiddenItemIds =
      preferences.hiddenItemIds.filter(
        (
          itemId
        ) =>
          itemId !==
          input.itemId
      );

    return this.touch(
      preferences
    );
  }

  async clearHiddenItems(
    input:
      ClearMobileAdvertisingHiddenItemsInput
  ): Promise<MobileAdvertisingPreferences> {
    const preferences =
      this.getOrCreatePreferences(
        input.userId
      );

    preferences.hiddenItemIds =
      [];

    return this.touch(
      preferences
    );
  }

  async resetPreferences(
    input:
      ResetMobileAdvertisingPreferencesInput
  ): Promise<MobileAdvertisingPreferences> {
    const preferences =
      this.getOrCreatePreferences(
        input.userId
      );

    preferences.personalizedAdsEnabled =
      false;

    preferences.hiddenItemIds =
      [];

    return this.touch(
      preferences
    );
  }
}

function createFixture(): {
  repository:
    InMemoryMobileAdvertisingPreferencesRepository;
  service:
    MobileAdvertisingPreferencesService;
} {
  const repository =
    new InMemoryMobileAdvertisingPreferencesRepository();

  return {
    repository,

    service:
      createMobileAdvertisingPreferencesService(
        repository
      ),
  };
}

describe(
  "MobileAdvertisingPreferencesService",
  () => {
    it(
      "returns default advertising preferences",
      async () => {
        const {
          service,
        } =
          createFixture();

        await expect(
          service.getPreferences({
            userId:
              USER_ID,
          })
        ).resolves.toMatchObject({
          userId:
            USER_ID,

          personalizedAdsEnabled:
            false,

          hiddenItemIds:
            [],
        });
      }
    );

    it(
      "sets personalized ads enabled",
      async () => {
        const {
          service,
        } =
          createFixture();

        const preferences =
          await service.setPersonalizedAdsEnabled({
            userId:
              USER_ID,

            enabled:
              true,
          });

        expect(
          preferences.personalizedAdsEnabled
        ).toBe(true);

        await expect(
          service.getPreferences({
            userId:
              USER_ID,
          })
        ).resolves.toMatchObject({
          personalizedAdsEnabled:
            true,
        });
      }
    );

    it(
      "normalizes and deduplicates hidden monetization item ids",
      async () => {
        const {
          service,
        } =
          createFixture();

        await service.hideItem({
          userId:
            USER_ID,

          itemId:
            " campaign-1 ",
        });

        const preferences =
          await service.hideItem({
            userId:
              USER_ID,

            itemId:
              "campaign-1",
          });

        expect(
          preferences.hiddenItemIds
        ).toEqual([
          "campaign-1",
        ]);
      }
    );

    it(
      "unhides one hidden monetization item",
      async () => {
        const {
          service,
        } =
          createFixture();

        await service.hideItem({
          userId:
            USER_ID,

          itemId:
            "campaign-1",
        });

        await service.hideItem({
          userId:
            USER_ID,

          itemId:
            "campaign-2",
        });

        const preferences =
          await service.unhideItem({
            userId:
              USER_ID,

            itemId:
              "campaign-1",
          });

        expect(
          preferences.hiddenItemIds
        ).toEqual([
          "campaign-2",
        ]);
      }
    );

    it(
      "clears hidden monetization items without changing personalized ads",
      async () => {
        const {
          service,
        } =
          createFixture();

        await service.setPersonalizedAdsEnabled({
          userId:
            USER_ID,

          enabled:
            true,
        });

        await service.hideItem({
          userId:
            USER_ID,

          itemId:
            "campaign-1",
        });

        const preferences =
          await service.clearHiddenItems({
            userId:
              USER_ID,
          });

        expect(
          preferences.personalizedAdsEnabled
        ).toBe(true);

        expect(
          preferences.hiddenItemIds
        ).toEqual([]);
      }
    );

    it(
      "resets advertising preferences to defaults",
      async () => {
        const {
          service,
        } =
          createFixture();

        await service.setPersonalizedAdsEnabled({
          userId:
            USER_ID,

          enabled:
            true,
        });

        await service.hideItem({
          userId:
            USER_ID,

          itemId:
            "campaign-1",
        });

        const preferences =
          await service.resetPreferences({
            userId:
              USER_ID,
          });

        expect(
          preferences.personalizedAdsEnabled
        ).toBe(false);

        expect(
          preferences.hiddenItemIds
        ).toEqual([]);
      }
    );

    it(
      "rejects blank hidden monetization item ids",
      async () => {
        const {
          service,
        } =
          createFixture();

        await expect(
          service.hideItem({
            userId:
              USER_ID,

            itemId:
              "   ",
          })
        ).rejects.toThrow(
          "Hidden monetization item id is required."
        );
      }
    );
  }
);
