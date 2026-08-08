export interface AccountSelectedInterest {
  topicId:
    string;

  topicSlug:
    string;

  topicName:
    string;

  personalizationAllowed:
    boolean;

  campaignTargetingAllowed:
    boolean;

  selectedAt:
    string | null;

  consentUpdatedAt:
    string | null;
}

export interface AccountSelectedInterestsSnapshot {
  userId:
    string;

  selectedInterests:
    string[];

  interests:
    AccountSelectedInterest[];

  updatedAt:
    string;
}

export interface GetAccountSelectedInterestsInput {
  userId:
    string;
}

export interface ReplaceAccountSelectedInterestsInput {
  userId:
    string;

  selectedInterests:
    string[];
}

export interface AccountSelectedInterestsRepository {
  getSelectedInterests(
    input:
      GetAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot>;

  replaceSelectedInterests(
    input:
      ReplaceAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot>;
}
