export interface PosterBrainSourceDiscoveryTaxonomyTopic {
  readonly id:
    string;

  readonly slug:
    string;

  readonly name:
    string;

  readonly description:
    string | null;

  readonly parentTopicId:
    string | null;

  readonly sortOrder:
    number;
}

export interface PosterBrainSourceDiscoveryPlannedTopic {
  readonly topicId:
    string;

  readonly slug:
    string;

  readonly name:
    string;

  readonly parentTopicId:
    string | null;

  readonly depth:
    number;

  readonly pathSlugs:
    readonly string[];

  readonly pathNames:
    readonly string[];
}

export interface PosterBrainSourceDiscoveryQuery {
  readonly queryKey:
    string;

  readonly parentTopicId:
    string;

  readonly topicId:
    string;

  readonly topicSlug:
    string;

  readonly topicName:
    string;

  readonly depth:
    number;

  readonly query:
    string;

  readonly pathSlugs:
    readonly string[];
}

export interface PosterBrainSourceDiscoveryPlan {
  readonly parentTopic:
    PosterBrainSourceDiscoveryPlannedTopic;

  readonly topics:
    readonly PosterBrainSourceDiscoveryPlannedTopic[];

  readonly queries:
    readonly PosterBrainSourceDiscoveryQuery[];
}

export interface PosterBrainSourceDiscoveryProviderItem {
  readonly externalContentId:
    string;

  readonly originalUrl:
    string;

  readonly publisherName:
    string;

  readonly sourceExternalId:
    string | null;

  readonly sourceName:
    string | null;
}

export interface PosterBrainSourceDiscoveryProviderExecution {
  readonly status:
    "succeeded" |
    "disabled" |
    "failed";

  readonly items:
    readonly PosterBrainSourceDiscoveryProviderItem[];

  readonly nextCursor:
    string | null;
}

export interface PosterBrainSourceDiscoveryProviderExecutor {
  readonly providerKeys:
    readonly string[];

  execute(
    input: {
      readonly providerKey:
        string;

      readonly query:
        string;

      readonly pageSize:
        number;

      readonly cursor?:
        string;
    }
  ):
    Promise<
      PosterBrainSourceDiscoveryProviderExecution
    >;
}

export interface PosterBrainSourceDiscoveryObservation {
  readonly candidateKey:
    string;

  readonly topicId:
    string;

  readonly topicSlug:
    string;

  readonly queryKey:
    string;

  readonly providerKey:
    string;

  readonly externalContentId:
    string;
}

export interface PosterBrainSourceDiscoveryRunResult {
  readonly parentTopicId:
    string;

  readonly parentTopicSlug:
    string;

  readonly plannedTopicCount:
    number;

  readonly plannedQueryCount:
    number;

  readonly providerCount:
    number;

  readonly providerRequestCount:
    number;

  readonly succeededRequestCount:
    number;

  readonly disabledRequestCount:
    number;

  readonly failedRequestCount:
    number;

  readonly discoveredItemCount:
    number;

  readonly rejectedItemCount:
    number;

  readonly persistedObservationCount:
    number;

  readonly uniqueCandidateCount:
    number;

  readonly observations:
    readonly PosterBrainSourceDiscoveryObservation[];
}