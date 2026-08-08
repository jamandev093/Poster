import type {
  AccountSelectedInterestsRepository,
  AccountSelectedInterestsSnapshot,
  GetAccountSelectedInterestsInput,
  ReplaceAccountSelectedInterestsInput,
} from "../../domains/interests/index.js";

const MAX_SELECTED_INTERESTS =
  80;

function normalizeUserId(
  userId:
    string
): string {
  const normalized =
    userId.trim();

  if (!normalized) {
    throw new Error(
      "User id is required."
    );
  }

  return normalized;
}

function normalizeInterestIdentifier(
  value:
    string
): string {
  const normalized =
    value
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

  if (!normalized) {
    throw new Error(
      "Selected interest is required."
    );
  }

  if (
    normalized.length >
    120
  ) {
    throw new Error(
      "Selected interest must be 120 characters or fewer."
    );
  }

  return normalized;
}

function normalizeSelectedInterests(
  selectedInterests:
    readonly string[]
): string[] {
  if (
    selectedInterests.length >
    MAX_SELECTED_INTERESTS
  ) {
    throw new Error(
      `Selected interests cannot exceed ${MAX_SELECTED_INTERESTS}.`
    );
  }

  const seen =
    new Set<string>();

  const result:
    string[] = [];

  selectedInterests.forEach((interest) => {
    const normalized =
      normalizeInterestIdentifier(
        interest
      );

    if (
      seen.has(
        normalized
      )
    ) {
      return;
    }

    seen.add(
      normalized
    );

    result.push(
      normalized
    );
  });

  return result;
}

export interface AccountSelectedInterestsService {
  getSelectedInterests(
    input:
      GetAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot>;

  replaceSelectedInterests(
    input:
      ReplaceAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot>;
}

class DefaultAccountSelectedInterestsService
implements AccountSelectedInterestsService {
  constructor(
    private readonly repository:
      AccountSelectedInterestsRepository
  ) {}

  async getSelectedInterests(
    input:
      GetAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot> {
    return this.repository.getSelectedInterests({
      userId:
        normalizeUserId(
          input.userId
        ),
    });
  }

  async replaceSelectedInterests(
    input:
      ReplaceAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot> {
    return this.repository.replaceSelectedInterests({
      userId:
        normalizeUserId(
          input.userId
        ),

      selectedInterests:
        normalizeSelectedInterests(
          input.selectedInterests
        ),
    });
  }
}

export function createAccountSelectedInterestsService(
  repository:
    AccountSelectedInterestsRepository
): AccountSelectedInterestsService {
  return new DefaultAccountSelectedInterestsService(
    repository
  );
}
