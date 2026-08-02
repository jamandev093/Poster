export interface FeedbackReason {
  id: string;
  title: string;
  description?: string;
}

export const feedbackReasons: FeedbackReason[] = [
  {
    id: "misleading",
    title: "Misleading or inaccurate",
    description:
      "The article contains false, deceptive, or inaccurate information.",
  },
  {
    id: "clickbait",
    title: "Clickbait or misleading title",
    description:
      "The headline exaggerates or does not accurately reflect the article.",
  },
  {
    id: "image",
    title: "Image does not match",
    description:
      "The featured image is unrelated, deceptive, or inappropriate.",
  },
  {
    id: "sensitive",
    title: "Explicit or disturbing content",
    description:
      "Contains sexual, graphic, violent, or otherwise disturbing material.",
  },
  {
    id: "hate",
    title: "Hate or harassment",
    description:
      "Attacks, threatens, or promotes hatred toward a person or group.",
  },
  {
    id: "spam",
    title: "Spam or scam",
    description:
      "Looks fraudulent, promotional, repetitive, or designed to deceive.",
  },
  {
    id: "duplicate",
    title: "Duplicate article",
    description:
      "The same article or story has already appeared in the feed.",
  },
  {
    id: "not_interested",
    title: "Not interested",
    description:
      "Use this signal to improve and personalize future recommendations.",
  },
  {
    id: "other",
    title: "Something else",
    description:
      "Report another problem with this article.",
  },
];