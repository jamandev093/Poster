import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createMobileUserActionsService,
} from "../src/application/mobile-actions/index.js";

import type {
  MobileUserActionsRepository,
  MobileUserBookmarkRecord,
  MobileUserInteractionState,
  RemoveMobileUserBookmarkInput,
  SaveMobileArticleFeedbackInput,
  SaveMobileArticleFeedbackResult,
  SaveMobileArticleInteractionInput,
  SaveMobileArticleInteractionResult,
  SaveMobileUserBookmarkInput,
} from "../src/domains/mobile-actions/index.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000101";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000201";

const SECOND_CONTENT_ID =
  "00000000-0000-4000-8000-000000000202";

function createBookmarkRecord(
  input:
    SaveMobileUserBookmarkInput
): MobileUserBookmarkRecord {
  return {
    id:
      `bookmark-${input.contentId}`,

    userId:
      input.userId,

    contentId:
      input.contentId,

    articleSnapshot:
      input.articleSnapshot ??
      null,

    createdAt:
      "2026-08-07T12:00:00.000Z",
  };
}

class InMemoryMobileUserActionsRepository
  implements MobileUserActionsRepository {
  private readonly bookmarks =
    new Map<
      string,
      MobileUserBookmarkRecord
    >();

  private readonly recommendedIds =
    new Set<string>();

  private readonly helpfulIds =
    new Set<string>();

  private readonly feedbackKeys =
    new Set<string>();

  async listBookmarks(
    userId:
      string
  ): Promise<MobileUserBookmarkRecord[]> {
    return Array.from(
      this.bookmarks.values()
    ).filter(
      (bookmark) =>
        bookmark.userId === userId
    );
  }

  async listInteractionState(
    userId:
      string
  ): Promise<MobileUserInteractionState> {
    return {
      bookmarkedIds:
        (
          await this.listBookmarks(
            userId
          )
        ).map(
          (bookmark) =>
            bookmark.contentId
        ),

      recommendedIds:
        Array.from(
          this.recommendedIds
        ),

      helpfulIds:
        Array.from(
          this.helpfulIds
        ),
    };
  }

  async findActiveBookmark(
    input:
      RemoveMobileUserBookmarkInput
  ): Promise<MobileUserBookmarkRecord | null> {
    return this.bookmarks.get(
      this.createBookmarkKey(
        input
      )
    ) ?? null;
  }

  async saveBookmark(
    input:
      SaveMobileUserBookmarkInput
  ): Promise<MobileUserBookmarkRecord> {
    const record =
      createBookmarkRecord(
        input
      );

    this.bookmarks.set(
      this.createBookmarkKey(
        input
      ),
      record
    );

    return record;
  }

  async removeBookmark(
    input:
      RemoveMobileUserBookmarkInput
  ): Promise<boolean> {
    return this.bookmarks.delete(
      this.createBookmarkKey(
        input
      )
    );
  }

  async saveInteraction(
    input:
      SaveMobileArticleInteractionInput
  ): Promise<SaveMobileArticleInteractionResult> {
    const targetSet =
      input.interactionType ===
        "worth_reading"
        ? this.recommendedIds
        : this.helpfulIds;

    const created =
      !targetSet.has(
        input.contentId
      );

    targetSet.add(
      input.contentId
    );

    return {
      interactionType:
        input.interactionType,

      created,
    };
  }

  async saveFeedback(
    input:
      SaveMobileArticleFeedbackInput
  ): Promise<SaveMobileArticleFeedbackResult> {
    const key =
      [
        input.userId,
        input.contentId,
        input.reasonId,
      ].join(
        ":"
      );

    const duplicate =
      this.feedbackKeys.has(
        key
      );

    this.feedbackKeys.add(
      key
    );

    return {
      success:
        true,

      duplicate,
    };
  }

  private createBookmarkKey(
    input:
      RemoveMobileUserBookmarkInput
  ): string {
    return [
      input.userId,
      input.contentId,
    ].join(
      ":"
    );
  }
}

function createService() {
  const repository =
    new InMemoryMobileUserActionsRepository();

  return {
    repository,

    service:
      createMobileUserActionsService(
        repository
      ),
  };
}

describe(
  "Mobile user actions service",
  () => {
    it(
      "toggles a Mobile bookmark on and off",
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.toggleBookmark({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            articleSnapshot: {
              title:
                "Original publisher story",

              summary:
                "Publisher summary",

              publisher:
                "Example Publisher",

              publisherUrl:
                "example.com",

              image:
                "",

              publishedAt:
                "2026-08-07T10:00:00.000Z",

              discoveredAt:
                "2026-08-07T11:00:00.000Z",

              category:
                "Technology",

              originalUrl:
                "https://example.com/story",

              verified:
                true,
            },
          })
        ).resolves.toEqual({
          contentId:
            CONTENT_ID,

          bookmarked:
            true,
        });

        await expect(
          service.listBookmarks(
            USER_ID
          )
        ).resolves.toHaveLength(
          1
        );

        await expect(
          service.toggleBookmark({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,
          })
        ).resolves.toEqual({
          contentId:
            CONTENT_ID,

          bookmarked:
            false,
        });

        await expect(
          service.listBookmarks(
            USER_ID
          )
        ).resolves.toHaveLength(
          0
        );
      }
    );

    it(
      "records worth-reading and helpful interactions idempotently",
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.markWorthReading({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,
          })
        ).resolves.toMatchObject({
          interactionType:
            "worth_reading",

          created:
            true,
        });

        await expect(
          service.markWorthReading({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,
          })
        ).resolves.toMatchObject({
          interactionType:
            "worth_reading",

          created:
            false,
        });

        await expect(
          service.markHelpful({
            userId:
              USER_ID,

            contentId:
              SECOND_CONTENT_ID,
          })
        ).resolves.toMatchObject({
          interactionType:
            "helpful",

          created:
            true,
        });

        await expect(
          service.getInteractionState(
            USER_ID
          )
        ).resolves.toEqual({
          bookmarkedIds:
            [],

          recommendedIds:
            [
              CONTENT_ID,
            ],

          helpfulIds:
            [
              SECOND_CONTENT_ID,
            ],
        });
      }
    );

    it(
      "deduplicates article feedback by user, content, and reason",
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.submitFeedback({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            reasonId:
              "misleading",
          })
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            false,
        });

        await expect(
          service.submitFeedback({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            reasonId:
              "misleading",
          })
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            true,
        });
      }
    );

    it(
      "rejects invalid action identifiers before repository writes",
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.markHelpful({
            userId:
              "not-a-user-id",

            contentId:
              CONTENT_ID,
          })
        ).rejects.toThrow(
          "User ID must be a valid UUID."
        );

        await expect(
          service.submitFeedback({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            reasonId:
              "Invalid Reason!",
          })
        ).rejects.toThrow(
          "Feedback reason is invalid."
        );
      }
    );
  }
);
