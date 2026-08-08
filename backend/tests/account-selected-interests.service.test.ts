import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAccountSelectedInterestsService,
  type AccountSelectedInterestsService,
} from "../src/application/authentication/account-selected-interests.service.js";

import type {
  AccountSelectedInterest,
  AccountSelectedInterestsRepository,
  AccountSelectedInterestsSnapshot,
  GetAccountSelectedInterestsInput,
  ReplaceAccountSelectedInterestsInput,
} from "../src/domains/interests/index.js";

const USER_ID =
  "00000000-0000-4000-8000-000000001001";

function interest(
  topicSlug:
    string
): AccountSelectedInterest {
  return {
    topicId:
      `topic-${topicSlug}`,

    topicSlug,

    topicName:
      topicSlug
        .split("-")
        .map(
          (part) =>
            `${part.charAt(0).toUpperCase()}${part.slice(1)}`
        )
        .join(" "),

    personalizationAllowed:
      true,

    campaignTargetingAllowed:
      false,

    selectedAt:
      "2026-08-08T06:00:00.000Z",

    consentUpdatedAt:
      "2026-08-08T06:00:00.000Z",
  };
}

function snapshot(
  userId:
    string,
  selectedInterests:
    readonly string[]
): AccountSelectedInterestsSnapshot {
  return {
    userId,

    selectedInterests:
      [
        ...selectedInterests,
      ],

    interests:
      selectedInterests.map(
        interest
      ),

    updatedAt:
      "2026-08-08T06:00:00.000Z",
  };
}

class InMemoryAccountSelectedInterestsRepository
implements AccountSelectedInterestsRepository {
  selectedInterests:
    string[] =
      [];

  lastReplaceInput:
    ReplaceAccountSelectedInterestsInput | null =
      null;

  async getSelectedInterests(
    input:
      GetAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot> {
    return snapshot(
      input.userId,
      this.selectedInterests
    );
  }

  async replaceSelectedInterests(
    input:
      ReplaceAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot> {
    this.lastReplaceInput =
      {
        userId:
          input.userId,

        selectedInterests:
          [
            ...input.selectedInterests,
          ],
      };

    this.selectedInterests =
      [
        ...input.selectedInterests,
      ];

    return snapshot(
      input.userId,
      this.selectedInterests
    );
  }
}

function createFixture(): {
  repository:
    InMemoryAccountSelectedInterestsRepository;
  service:
    AccountSelectedInterestsService;
} {
  const repository =
    new InMemoryAccountSelectedInterestsRepository();

  return {
    repository,

    service:
      createAccountSelectedInterestsService(
        repository
      ),
  };
}

describe(
  "AccountSelectedInterestsService",
  () => {
    it(
      "reads selected interests from the repository",
      async () => {
        const {
          repository,
          service,
        } =
          createFixture();

        repository.selectedInterests =
          [
            "artificial-intelligence",
            "climate",
          ];

        await expect(
          service.getSelectedInterests({
            userId:
              USER_ID,
          })
        ).resolves.toMatchObject({
          userId:
            USER_ID,

          selectedInterests:
            [
              "artificial-intelligence",
              "climate",
            ],
        });
      }
    );

    it(
      "normalizes and deduplicates selected interests before writing",
      async () => {
        const {
          repository,
          service,
        } =
          createFixture();

        const result =
          await service.replaceSelectedInterests({
            userId:
              ` ${USER_ID} `,

            selectedInterests:
              [
                " Artificial Intelligence ",
                "artificial-intelligence",
                "Climate   Science",
              ],
          });

        expect(
          repository.lastReplaceInput
        ).toEqual({
          userId:
            USER_ID,

          selectedInterests:
            [
              "artificial-intelligence",
              "climate-science",
            ],
        });

        expect(
          result.selectedInterests
        ).toEqual([
          "artificial-intelligence",
          "climate-science",
        ]);
      }
    );

    it(
      "allows clearing selected interests",
      async () => {
        const {
          service,
        } =
          createFixture();

        const result =
          await service.replaceSelectedInterests({
            userId:
              USER_ID,

            selectedInterests:
              [],
          });

        expect(
          result.selectedInterests
        ).toEqual([]);
      }
    );

    it(
      "rejects blank user ids",
      async () => {
        const {
          service,
        } =
          createFixture();

        await expect(
          service.getSelectedInterests({
            userId:
              "   ",
          })
        ).rejects.toThrow(
          "User id is required."
        );
      }
    );

    it(
      "rejects blank selected interest ids",
      async () => {
        const {
          service,
        } =
          createFixture();

        await expect(
          service.replaceSelectedInterests({
            userId:
              USER_ID,

            selectedInterests:
              [
                "   ",
              ],
          })
        ).rejects.toThrow(
          "Selected interest is required."
        );
      }
    );

    it(
      "caps selected interests at the platform limit",
      async () => {
        const {
          service,
        } =
          createFixture();

        await expect(
          service.replaceSelectedInterests({
            userId:
              USER_ID,

            selectedInterests:
              Array.from(
                {
                  length:
                    81,
                },
                (
                  _,
                  index
                ) =>
                  `topic-${index}`
              ),
          })
        ).rejects.toThrow(
          "Selected interests cannot exceed 80."
        );
      }
    );
  }
);
