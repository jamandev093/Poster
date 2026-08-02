export type ContentVisibilityDecision =
  | "allow"
  | "allow_with_context"
  | "restrict"
  | "review"
  | "block";

export type ContentVisibilityCategory =
  | "general"
  | "adult_explicit"
  | "sexual_health"
  | "misinformation"
  | "fraud"
  | "malware"
  | "extremism"
  | "hate"
  | "self_harm"
  | "illegal_activity"
  | "dangerous_activity"
  | "regulated_goods";

export type ContentVisibilityIntent =
  | "general"
  | "education"
  | "research"
  | "news"
  | "awareness"
  | "prevention"
  | "unknown";

export interface ContentVisibilityContext {
  intent?: ContentVisibilityIntent;

  /**
   * Set when the content is clearly
   * correcting, debunking, fact-checking,
   * or explaining a harmful claim.
   */
  correctiveContext?: boolean;

  /**
   * Future backend/Admin signal.
   * Frontend does not determine publisher
   * trustworthiness by itself.
   */
  trustedSource?: boolean;
}

export interface ContentVisibilityEvaluation {
  decision:
    ContentVisibilityDecision;

  normalizedText: string;

  categories:
    ContentVisibilityCategory[];

  reasons: string[];

  matchedSignals: string[];

  educationalContext: boolean;

  correctiveContext: boolean;
}

interface SignalRule {
  category:
    ContentVisibilityCategory;

  signals:
    readonly string[];
}

const EDUCATIONAL_CONTEXT_SIGNALS =
  [
    "education",
    "educational",
    "learn",
    "learning",
    "research",
    "study",
    "studies",
    "academic",
    "science",
    "scientific",
    "history",
    "historical",
    "news",
    "journalism",
    "investigation",
    "investigative",
    "awareness",
    "prevention",
    "safety",
    "public health",
    "health education",
    "media literacy",
    "fact check",
    "fact-check",
    "fact checking",
    "debunk",
    "debunking",
    "misinformation analysis",
    "disinformation analysis",
    "explained",
    "explanation",
    "causes",
    "effects",
    "impact",
    "risks",
    "recovery",
    "treatment",
    "support",
  ] as const;

const CORRECTIVE_CONTEXT_SIGNALS =
  [
    "fact check",
    "fact-check",
    "fact checking",
    "debunk",
    "debunking",
    "false claim",
    "false claims",
    "misinformation",
    "disinformation",
    "myth",
    "myths",
    "correction",
    "corrections",
    "verified facts",
    "evidence based",
    "evidence-based",
    "media literacy",
  ] as const;

/**
 * Narrow exact labels that should not
 * become dynamic discovery topics by
 * themselves.
 *
 * Longer educational/news queries that
 * merely contain these words are evaluated
 * contextually instead.
 */
const BLOCKED_EXACT_TOPICS =
  new Set<string>([
    "porn",
    "pornography",
    "xxx",
    "adult videos",
    "explicit videos",
    "nudes",
    "nude videos",
  ]);

const SENSITIVE_SIGNAL_RULES:
  readonly SignalRule[] = [
    {
      category:
        "adult_explicit",

      signals: [
        "porn",
        "pornography",
        "xxx",
        "explicit sexual",
        "adult video",
        "adult videos",
        "nude video",
        "nude videos",
      ],
    },

    {
      category:
        "sexual_health",

      signals: [
        "sexual health",
        "sex education",
        "reproductive health",
        "sexual wellbeing",
        "sexual well-being",
      ],
    },

    {
      category:
        "misinformation",

      signals: [
        "misinformation",
        "disinformation",
        "fake news",
        "false claims",
        "conspiracy theory",
        "conspiracy theories",
      ],
    },

    {
      category:
        "fraud",

      signals: [
        "scam",
        "scams",
        "fraud",
        "phishing",
        "identity theft",
        "financial deception",
      ],
    },

    {
      category:
        "malware",

      signals: [
        "malware",
        "ransomware",
        "computer virus",
        "spyware",
        "credential theft",
      ],
    },

    {
      category:
        "extremism",

      signals: [
        "extremism",
        "extremist",
        "terrorism",
        "terrorist",
        "radicalization",
      ],
    },

    {
      category:
        "hate",

      signals: [
        "hate speech",
        "hate crime",
        "hate crimes",
        "racial hatred",
        "religious hatred",
      ],
    },

    {
      category:
        "self_harm",

      signals: [
        "self harm",
        "self-harm",
        "suicide",
        "suicidal",
      ],
    },

    {
      category:
        "illegal_activity",

      signals: [
        "illegal activity",
        "criminal activity",
        "drug trafficking",
        "human trafficking",
        "money laundering",
      ],
    },

    {
      category:
        "dangerous_activity",

      signals: [
        "dangerous challenge",
        "dangerous experiment",
        "explosive device",
        "weapon construction",
      ],
    },

    {
      category:
        "regulated_goods",

      signals: [
        "illegal drugs",
        "illegal weapons",
        "unlicensed firearms",
        "counterfeit medicine",
      ],
    },
  ];

const DIRECT_HARMFUL_INTENT_PATTERNS:
  readonly RegExp[] = [
    /\bhow\s+to\s+(?:spread|create|publish)\s+(?:fake\s+news|misinformation|disinformation)\b/i,

    /\bhow\s+to\s+(?:scam|defraud|phish|deceive)\b/i,

    /\bhow\s+to\s+steal\s+(?:passwords?|credentials?|identity)\b/i,

    /\bcreate\s+(?:a\s+)?phishing\s+(?:page|site|email|campaign)\b/i,

    /\bdeploy\s+(?:malware|ransomware|spyware)\b/i,

    /\bhow\s+to\s+(?:make|build|construct)\s+(?:an?\s+)?(?:explosive|bomb)\b/i,

    /\bhow\s+to\s+traffic\s+(?:drugs?|people|weapons?)\b/i,

    /\bhow\s+to\s+launder\s+money\b/i,

    /\bencourage\s+(?:self[- ]?harm|suicide)\b/i,

    /\bpromote\s+(?:terrorism|extremist\s+violence)\b/i,

    /\brecruit\s+(?:for|into)\s+(?:a\s+)?terrorist\b/i,
  ];

const EXPLICIT_CONTENT_PATTERNS:
  readonly RegExp[] = [
    /\b(?:watch|download|find|stream)\s+(?:free\s+)?porn\b/i,

    /\b(?:watch|download|find|stream)\s+xxx\b/i,

    /\bexplicit\s+adult\s+(?:video|videos|content)\b/i,

    /\bnude\s+(?:video|videos|photos?)\s+(?:download|collection|gallery)\b/i,
  ];

function createUniqueValues(
  values: readonly string[]
): string[] {
  return Array.from(
    new Set(
      values.filter(Boolean)
    )
  );
}

export function normalizeContentQuery(
  value: string
): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function containsSignal(
  normalizedText: string,
  signal: string
): boolean {
  return normalizedText.includes(
    signal
  );
}

function hasAnySignal(
  normalizedText: string,
  signals: readonly string[]
): boolean {
  return signals.some(
    (signal) =>
      containsSignal(
        normalizedText,
        signal
      )
  );
}

function resolveEducationalContext(
  normalizedText: string,
  context?: ContentVisibilityContext
): boolean {
  if (
    context?.intent ===
      "education" ||
    context?.intent ===
      "research" ||
    context?.intent ===
      "news" ||
    context?.intent ===
      "awareness" ||
    context?.intent ===
      "prevention"
  ) {
    return true;
  }

  return hasAnySignal(
    normalizedText,
    EDUCATIONAL_CONTEXT_SIGNALS
  );
}

function resolveCorrectiveContext(
  normalizedText: string,
  context?: ContentVisibilityContext
): boolean {
  if (
    context?.correctiveContext
  ) {
    return true;
  }

  return hasAnySignal(
    normalizedText,
    CORRECTIVE_CONTEXT_SIGNALS
  );
}

function resolveCategories(
  normalizedText: string
): {
  categories:
    ContentVisibilityCategory[];

  matchedSignals: string[];
} {
  const categories:
    ContentVisibilityCategory[] =
    [];

  const matchedSignals:
    string[] = [];

  SENSITIVE_SIGNAL_RULES.forEach(
    (rule) => {
      const matches =
        rule.signals.filter(
          (signal) =>
            containsSignal(
              normalizedText,
              signal
            )
        );

      if (
        matches.length === 0
      ) {
        return;
      }

      categories.push(
        rule.category
      );

      matchedSignals.push(
        ...matches
      );
    }
  );

  if (
    categories.length === 0
  ) {
    categories.push(
      "general"
    );
  }

  return {
    categories:
      createUniqueValues(
        categories
      ) as ContentVisibilityCategory[],

    matchedSignals:
      createUniqueValues(
        matchedSignals
      ),
  };
}

function matchesAnyPattern(
  value: string,
  patterns:
    readonly RegExp[]
): boolean {
  return patterns.some(
    (pattern) =>
      pattern.test(value)
  );
}

export function evaluateContentVisibility(
  value: string,
  context?: ContentVisibilityContext
): ContentVisibilityEvaluation {
  const normalizedText =
    normalizeContentQuery(
      value
    );

  if (!normalizedText) {
    return {
      decision: "block",

      normalizedText,

      categories: [
        "general",
      ],

      reasons: [
        "Empty topics cannot be surfaced.",
      ],

      matchedSignals: [],

      educationalContext:
        false,

      correctiveContext:
        false,
    };
  }

  const educationalContext =
    resolveEducationalContext(
      normalizedText,
      context
    );

  const correctiveContext =
    resolveCorrectiveContext(
      normalizedText,
      context
    );

  const {
    categories,
    matchedSignals,
  } = resolveCategories(
    normalizedText
  );

  if (
    matchesAnyPattern(
      normalizedText,
      DIRECT_HARMFUL_INTENT_PATTERNS
    )
  ) {
    return {
      decision: "block",

      normalizedText,

      categories,

      reasons: [
        "The query appears to request harmful, deceptive, illegal, or abusive instructions.",
      ],

      matchedSignals,

      educationalContext,

      correctiveContext,
    };
  }

  if (
    matchesAnyPattern(
      normalizedText,
      EXPLICIT_CONTENT_PATTERNS
    )
  ) {
    return {
      decision: "block",

      normalizedText,

      categories:
        createUniqueValues([
          ...categories,
          "adult_explicit",
        ]) as ContentVisibilityCategory[],

      reasons: [
        "Explicit adult-content discovery is outside Poster’s knowledge-focused content scope.",
      ],

      matchedSignals,

      educationalContext,

      correctiveContext,
    };
  }

  if (
    BLOCKED_EXACT_TOPICS.has(
      normalizedText
    ) &&
    !educationalContext
  ) {
    return {
      decision: "block",

      normalizedText,

      categories:
        createUniqueValues([
          ...categories,
          "adult_explicit",
        ]) as ContentVisibilityCategory[],

      reasons: [
        "The topic is an explicit-content label without educational, research, news, or awareness context.",
      ],

      matchedSignals,

      educationalContext,

      correctiveContext,
    };
  }

  if (
    categories.includes(
      "adult_explicit"
    )
  ) {
    return {
      decision:
        educationalContext
          ? "allow_with_context"
          : "restrict",

      normalizedText,

      categories,

      reasons: [
        educationalContext
          ? "Sensitive adult subject is allowed because the context is educational, research-oriented, news-related, or awareness-focused."
          : "Adult-sensitive topic requires stronger contextual classification before it can be surfaced.",
      ],

      matchedSignals,

      educationalContext,

      correctiveContext,
    };
  }

  if (
    categories.includes(
      "misinformation"
    )
  ) {
    return {
      decision:
        correctiveContext ||
        educationalContext
          ? "allow_with_context"
          : "review",

      normalizedText,

      categories,

      reasons: [
        correctiveContext ||
        educationalContext
          ? "Discussion about misinformation is permitted for education, journalism, research, fact-checking, or awareness."
          : "Potential misinformation topic requires contextual verification before dynamic promotion.",
      ],

      matchedSignals,

      educationalContext,

      correctiveContext,
    };
  }

  const highRiskCategories:
    ContentVisibilityCategory[] =
    [
      "fraud",
      "malware",
      "extremism",
      "hate",
      "self_harm",
      "illegal_activity",
      "dangerous_activity",
      "regulated_goods",
    ];

  const hasHighRiskCategory =
    categories.some(
      (category) =>
        highRiskCategories.includes(
          category
        )
    );

  if (hasHighRiskCategory) {
    return {
      decision:
        educationalContext
          ? "allow_with_context"
          : "review",

      normalizedText,

      categories,

      reasons: [
        educationalContext
          ? "Sensitive subject is permitted for legitimate educational, news, research, prevention, or awareness purposes."
          : "Sensitive topic requires additional contextual review before being promoted as a dynamic discovery topic.",
      ],

      matchedSignals,

      educationalContext,

      correctiveContext,
    };
  }

  if (
    categories.includes(
      "sexual_health"
    )
  ) {
    return {
      decision:
        "allow_with_context",

      normalizedText,

      categories,

      reasons: [
        "Legitimate health and educational discussion is allowed.",
      ],

      matchedSignals,

      educationalContext:
        true,

      correctiveContext,
    };
  }

  return {
    decision: "allow",

    normalizedText,

    categories,

    reasons: [
      "No blocking or restricted visibility signals were detected.",
    ],

    matchedSignals,

    educationalContext,

    correctiveContext,
  };
}

export function canSurfaceContentTopic(
  value: string,
  context?: ContentVisibilityContext
): boolean {
  const evaluation =
    evaluateContentVisibility(
      value,
      context
    );

  return (
    evaluation.decision ===
      "allow" ||
    evaluation.decision ===
      "allow_with_context"
  );
}

export function requiresContentReview(
  value: string,
  context?: ContentVisibilityContext
): boolean {
  const decision =
    evaluateContentVisibility(
      value,
      context
    ).decision;

  return (
    decision === "review" ||
    decision === "restrict"
  );
}

export function isContentBlocked(
  value: string,
  context?: ContentVisibilityContext
): boolean {
  return (
    evaluateContentVisibility(
      value,
      context
    ).decision ===
    "block"
  );
}