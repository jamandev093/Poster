import type {
  MobileActionArticleSnapshot,
  MobileArticleInteractionType,
  MobileUserActionsRepository,
  MobileUserBookmarkRecord,
  MobileUserInteractionState,
  SaveMobileArticleFeedbackResult,
  SaveMobileArticleInteractionResult,
} from "../../domains/mobile-actions/index.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FEEDBACK_REASON_PATTERN =
  /^[a-z0-9_-]{2,64}$/;

export interface ToggleMobileBookmarkInput {
  userId:
    string;

  contentId:
    string;

  articleSnapshot?:
    MobileActionArticleSnapshot |
    null;
}

export interface ToggleMobileBookmarkResult {
  contentId:
    string;

  bookmarked:
    boolean;
}

export interface MobileContentActionInput {
  userId:
    string;

  contentId:
    string;
}

export interface SubmitMobileArticleFeedbackInput
  extends MobileContentActionInput {
  reasonId:
    string;
}

export interface MobileUserActionsService {
  listBookmarks(
    userId:
      string
  ): Promise<MobileUserBookmarkRecord[]>;

  getInteractionState(
    userId:
      string
  ): Promise<MobileUserInteractionState>;

  toggleBookmark(
    input:
      ToggleMobileBookmarkInput
  ): Promise<ToggleMobileBookmarkResult>;

  markWorthReading(
    input:
      MobileContentActionInput
  ): Promise<SaveMobileArticleInteractionResult>;

  markHelpful(
    input:
      MobileContentActionInput
  ): Promise<SaveMobileArticleInteractionResult>;

  submitFeedback(
    input:
      SubmitMobileArticleFeedbackInput
  ): Promise<SaveMobileArticleFeedbackResult>;
}

function normalizeUuid(
  value:
    string,
  label:
    string
): string {
  const normalized =
    value.trim();

  if (
    !UUID_PATTERN.test(
      normalized
    )
  ) {
    throw new Error(
      `${label} must be a valid UUID.`
    );
  }

  return normalized;
}

function normalizeFeedbackReason(
  value:
    string
): string {
  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    !FEEDBACK_REASON_PATTERN.test(
      normalized
    )
  ) {
    throw new Error(
      "Feedback reason is invalid."
    );
  }

  return normalized;
}

function normalizeContentActionInput(
  input:
    MobileContentActionInput
): MobileContentActionInput {
  return {
    userId:
      normalizeUuid(
        input.userId,
        "User ID"
      ),

    contentId:
      normalizeUuid(
        input.contentId,
        "Content ID"
      ),
  };
}

export class DefaultMobileUserActionsService
  implements MobileUserActionsService {
  constructor(
    private readonly repository:
      MobileUserActionsRepository
  ) {}

  async listBookmarks(
    userId:
      string
  ): Promise<MobileUserBookmarkRecord[]> {
    return this.repository.listBookmarks(
      normalizeUuid(
        userId,
        "User ID"
      )
    );
  }

  async getInteractionState(
    userId:
      string
  ): Promise<MobileUserInteractionState> {
    return this.repository.listInteractionState(
      normalizeUuid(
        userId,
        "User ID"
      )
    );
  }

  async toggleBookmark(
    input:
      ToggleMobileBookmarkInput
  ): Promise<ToggleMobileBookmarkResult> {
    const normalizedInput =
      normalizeContentActionInput(
        input
      );

    const existing =
      await this.repository.findActiveBookmark(
        normalizedInput
      );

    if (existing) {
      await this.repository.removeBookmark(
        normalizedInput
      );

      return {
        contentId:
          normalizedInput.contentId,

        bookmarked:
          false,
      };
    }

    await this.repository.saveBookmark({
      ...normalizedInput,

      articleSnapshot:
        input.articleSnapshot ??
        null,
    });

    return {
      contentId:
        normalizedInput.contentId,

      bookmarked:
        true,
    };
  }

  async markWorthReading(
    input:
      MobileContentActionInput
  ): Promise<SaveMobileArticleInteractionResult> {
    return this.saveInteraction(
      input,
      "worth_reading"
    );
  }

  async markHelpful(
    input:
      MobileContentActionInput
  ): Promise<SaveMobileArticleInteractionResult> {
    return this.saveInteraction(
      input,
      "helpful"
    );
  }

  async submitFeedback(
    input:
      SubmitMobileArticleFeedbackInput
  ): Promise<SaveMobileArticleFeedbackResult> {
    const normalizedInput =
      normalizeContentActionInput(
        input
      );

    return this.repository.saveFeedback({
      ...normalizedInput,

      reasonId:
        normalizeFeedbackReason(
          input.reasonId
        ),
    });
  }

  private async saveInteraction(
    input:
      MobileContentActionInput,
    interactionType:
      MobileArticleInteractionType
  ): Promise<SaveMobileArticleInteractionResult> {
    const normalizedInput =
      normalizeContentActionInput(
        input
      );

    return this.repository.saveInteraction({
      ...normalizedInput,

      interactionType,
    });
  }
}

export function createMobileUserActionsService(
  repository:
    MobileUserActionsRepository
): MobileUserActionsService {
  return new DefaultMobileUserActionsService(
    repository
  );
}
