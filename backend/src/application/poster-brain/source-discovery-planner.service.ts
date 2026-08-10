import {
  listActiveTaxonomyTopics,
} from "../../domains/taxonomy/taxonomy.repository.js";

import type {
  PosterBrainSourceDiscoveryPlan,
  PosterBrainSourceDiscoveryPlannedTopic,
  PosterBrainSourceDiscoveryQuery,
  PosterBrainSourceDiscoveryTaxonomyTopic,
} from "./source-discovery.types.js";

export interface PosterBrainSourceDiscoveryPlanner {
  plan(
    input: {
      readonly parentTopicSlug:
        string;

      readonly maxDepth?:
        number;

      readonly maxTopics?:
        number;
    }
  ):
    Promise<
      PosterBrainSourceDiscoveryPlan
    >;
}

export interface PosterBrainSourceDiscoveryPlannerDependencies {
  readonly listActiveTopics?:
    () =>
      Promise<
        readonly PosterBrainSourceDiscoveryTaxonomyTopic[]
      >;
}

function normalizeSlug(
  value:
    string
): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase();
}

function cleanName(
  value:
    string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function boundedInteger(
  value:
    number | undefined,
  fallback:
    number,
  minimum:
    number,
  maximum:
    number,
  field:
    string
): number {
  const resolved =
    value ??
    fallback;

  if (
    !Number.isSafeInteger(
      resolved
    ) ||
    resolved < minimum ||
    resolved > maximum
  ) {
    throw new Error(
      `${field} must be between ${minimum} and ${maximum}.`
    );
  }

  return resolved;
}

function toPlannedTopic(
  topic:
    PosterBrainSourceDiscoveryTaxonomyTopic,
  depth:
    number,
  path:
    readonly PosterBrainSourceDiscoveryTaxonomyTopic[]
): PosterBrainSourceDiscoveryPlannedTopic {
  return {
    topicId:
      topic.id,

    slug:
      topic.slug,

    name:
      topic.name,

    parentTopicId:
      topic.parentTopicId,

    depth,

    pathSlugs:
      path.map(
        item =>
          item.slug
      ),

    pathNames:
      path.map(
        item =>
          item.name
      ),
  };
}

function createQueryText(
  path:
    readonly PosterBrainSourceDiscoveryTaxonomyTopic[]
): string {
  const values:
    string[] =
    [];

  const seen =
    new Set<string>();

  /*
   * Keep the root domain for context, but do not repeat
   * equivalent parent/child labels.
   */
  for (const topic of path) {
    const name =
      cleanName(
        topic.name
      );

    const key =
      name.toLowerCase();

    if (
      !name ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    values.push(name);
  }

  return values.join(" ");
}

function queryKey(
  topicId:
    string,
  query:
    string
): string {
  return [
    topicId,
    query
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim(),
  ].join(":");
}

export function createPosterBrainSourceDiscoveryPlanner(
  dependencies:
    PosterBrainSourceDiscoveryPlannerDependencies = {}
): PosterBrainSourceDiscoveryPlanner {
  const listTopics =
    dependencies.listActiveTopics ??
    (
      async () => {
        const topics =
          await listActiveTaxonomyTopics();

        return topics.map(
          topic => ({
            id:
              topic.id,

            slug:
              topic.slug,

            name:
              topic.name,

            description:
              topic.description,

            parentTopicId:
              topic.parentTopicId,

            sortOrder:
              topic.sortOrder,
          })
        );
      }
    );

  return {
    async plan(
      input
    ) {
      const requestedSlug =
        normalizeSlug(
          input.parentTopicSlug
        );

      if (!requestedSlug) {
        throw new Error(
          "Parent topic slug is required."
        );
      }

      const maxDepth =
        boundedInteger(
          input.maxDepth,
          3,
          0,
          5,
          "maxDepth"
        );

      const maxTopics =
        boundedInteger(
          input.maxTopics,
          24,
          1,
          100,
          "maxTopics"
        );

      const rawTopics =
        await listTopics();

      const topics =
        rawTopics
          .map(
            topic => ({
              ...topic,

              slug:
                normalizeSlug(
                  topic.slug
                ),

              name:
                cleanName(
                  topic.name
                ),
            })
          )
          .filter(
            topic =>
              topic.slug.length > 0 &&
              topic.name.length > 0
          );

      const parent =
        topics.find(
          topic =>
            topic.slug ===
            requestedSlug
        );

      if (parent === undefined) {
        throw new Error(
          `Active taxonomy parent topic not found: ${requestedSlug}`
        );
      }

      const children =
        new Map<
          string,
          PosterBrainSourceDiscoveryTaxonomyTopic[]
        >();

      for (const topic of topics) {
        if (topic.parentTopicId === null) {
          continue;
        }

        const bucket =
          children.get(
            topic.parentTopicId
          ) ??
          [];

        bucket.push(
          topic
        );

        children.set(
          topic.parentTopicId,
          bucket
        );
      }

      for (const bucket of children.values()) {
        bucket.sort(
          (
            left,
            right
          ) =>
            left.sortOrder -
              right.sortOrder ||
            left.name.localeCompare(
              right.name
            ) ||
            left.id.localeCompare(
              right.id
            )
        );
      }

      const plannedTopics:
        PosterBrainSourceDiscoveryPlannedTopic[] =
        [];

      const queries:
        PosterBrainSourceDiscoveryQuery[] =
        [];

      const seenQueryKeys =
        new Set<string>();

      const queue:
        Array<{
          readonly topic:
            PosterBrainSourceDiscoveryTaxonomyTopic;

          readonly depth:
            number;

          readonly path:
            readonly PosterBrainSourceDiscoveryTaxonomyTopic[];
        }> =
        [
          {
            topic:
              parent,

            depth:
              0,

            path: [
              parent,
            ],
          },
        ];

      while (
        queue.length > 0 &&
        plannedTopics.length < maxTopics
      ) {
        const current =
          queue.shift();

        if (current === undefined) {
          break;
        }

        plannedTopics.push(
          toPlannedTopic(
            current.topic,
            current.depth,
            current.path
          )
        );

        const text =
          createQueryText(
            current.path
          );

        const key =
          queryKey(
            current.topic.id,
            text
          );

        if (
          text &&
          !seenQueryKeys.has(key)
        ) {
          seenQueryKeys.add(key);

          queries.push({
            queryKey:
              key,

            parentTopicId:
              parent.id,

            topicId:
              current.topic.id,

            topicSlug:
              current.topic.slug,

            topicName:
              current.topic.name,

            depth:
              current.depth,

            query:
              text,

            pathSlugs:
              current.path.map(
                item =>
                  item.slug
              ),
          });
        }

        if (
          current.depth >=
          maxDepth
        ) {
          continue;
        }

        const directChildren =
          children.get(
            current.topic.id
          ) ??
          [];

        for (
          const child
          of directChildren
        ) {
          queue.push({
            topic:
              child,

            depth:
              current.depth +
              1,

            path: [
              ...current.path,
              child,
            ],
          });
        }
      }

      return {
        parentTopic:
          toPlannedTopic(
            parent,
            0,
            [
              parent,
            ]
          ),

        topics:
          plannedTopics,

        queries,
      };
    },
  };
}