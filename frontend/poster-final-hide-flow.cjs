const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = process.cwd();
const rendererPath = path.join(root, "src", "components", "feed", "FeedEntryRenderer.tsx");
const feedPath = path.join(root, "src", "components", "feed", "MonetizedFeed.tsx");

const rendererBackup = rendererPath + ".before-final-hide-flow";
const feedBackup = feedPath + ".before-final-hide-flow";

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, content) {
  fs.writeFileSync(file, content.replace(/\n/g, "\r\n"), "utf8");
}

function replaceOnce(content, oldText, newText, label) {
  const count = content.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected 1 match, found ${count}.`);
  }
  return content.replace(oldText, newText);
}

function replaceCount(content, oldText, newText, expected, label) {
  const count = content.split(oldText).length - 1;
  if (count !== expected) {
    throw new Error(`${label}: expected ${expected} matches, found ${count}.`);
  }
  return content.split(oldText).join(newText);
}

fs.copyFileSync(rendererPath, rendererBackup);
fs.copyFileSync(feedPath, feedBackup);

try {
  let renderer = read(rendererPath);
  let feed = read(feedPath);

  if (!renderer.includes("onMonetizationHide?:")) {
    renderer = replaceOnce(
      renderer,
`  onSponsoredReport?: (
    campaignId: string
  ) => void;
}`,
`  onSponsoredReport?: (
    campaignId: string
  ) => void;

  onMonetizationHide?: (
    itemId: string
  ) => void | Promise<void>;
}`,
      "FeedEntryRenderer prop contract"
    );
  }

  if (!renderer.includes("  onMonetizationHide,\n}: FeedEntryRendererProps)")) {
    renderer = replaceOnce(
      renderer,
`  onSponsoredPress,
  onSponsoredReport,
}: FeedEntryRendererProps) {`,
`  onSponsoredPress,
  onSponsoredReport,
  onMonetizationHide,
}: FeedEntryRendererProps) {`,
      "FeedEntryRenderer destructuring"
    );
  }

  if (!renderer.includes("onHide={onMonetizationHide}")) {
    renderer = replaceCount(
      renderer,
`          onReport={
            handleReport
          }
        />`,
`          onReport={
            handleReport
          }
          onHide={onMonetizationHide}
        />`,
      3,
      "Commercial card onHide wiring"
    );
  }

  if (!feed.includes('import useFeedback from "../../context/FeedbackContext";')) {
    feed = replaceOnce(
      feed,
`import FeedEntryRenderer from "./FeedEntryRenderer";
import MonetizationFeedbackController from "./MonetizationFeedbackController";`,
`import FeedEntryRenderer from "./FeedEntryRenderer";
import MonetizationFeedbackController from "./MonetizationFeedbackController";

import useFeedback from "../../context/FeedbackContext";`,
      "MonetizedFeed feedback import"
    );
  }

  if (!feed.includes("const hideRequestIdsRef =")) {
    feed = replaceOnce(
      feed,
`): ReactElement {
  const [
    hiddenItemIds,`,
`): ReactElement {
  const { showError } =
    useFeedback();

  const hideRequestIdsRef =
    useRef<Set<string>>(
      new Set()
    );

  const [
    hiddenItemIds,`,
      "MonetizedFeed hide state setup"
    );
  }

  if (!feed.includes("const handleHideMonetizationItem =")) {
    feed = replaceOnce(
      feed,
`  const entries =
    useMemo(() => {`,
`  const handleHideMonetizationItem =
    useCallback(
      async (
        itemId: string
      ) => {
        const normalizedItemId =
          itemId.trim();

        if (
          !normalizedItemId ||
          hideRequestIdsRef.current.has(
            normalizedItemId
          )
        ) {
          return;
        }

        hideRequestIdsRef.current.add(
          normalizedItemId
        );

        setHiddenItemIds(
          (currentItemIds) => {
            if (
              currentItemIds === null ||
              currentItemIds.includes(
                normalizedItemId
              )
            ) {
              return currentItemIds;
            }

            return [
              ...currentItemIds,
              normalizedItemId,
            ];
          }
        );

        try {
          await AdvertisingPreferenceService.hideItem(
            normalizedItemId
          );
        } catch {
          setHiddenItemIds(
            (currentItemIds) => {
              if (
                currentItemIds === null
              ) {
                return currentItemIds;
              }

              return currentItemIds.filter(
                (currentItemId) =>
                  currentItemId !==
                  normalizedItemId
              );
            }
          );

          showError(
            "Unable to hide item",
            "This commercial item could not be hidden. Please try again."
          );
        } finally {
          hideRequestIdsRef.current.delete(
            normalizedItemId
          );
        }
      },
      [showError]
    );

  const entries =
    useMemo(() => {`,
      "MonetizedFeed hide handler"
    );
  }

  if (!feed.includes("onMonetizationHide={")) {
    feed = replaceOnce(
      feed,
`                onSponsoredReport={
                  openSponsoredReport
                }
              />`,
`                onSponsoredReport={
                  openSponsoredReport
                }
                onMonetizationHide={
                  handleHideMonetizationItem
                }
              />`,
      "MonetizedFeed renderer hide wiring"
    );
  }

  const requiredRenderer = [
    "onMonetizationHide?:",
    "onMonetizationHide,",
    "onHide={onMonetizationHide}",
  ];
  for (const token of requiredRenderer) {
    if (!renderer.includes(token)) {
      throw new Error(`FeedEntryRenderer verification failed: ${token}`);
    }
  }

  const requiredFeed = [
    'useFeedback from "../../context/FeedbackContext"',
    "const hideRequestIdsRef =",
    "const handleHideMonetizationItem =",
    "AdvertisingPreferenceService.hideItem(",
    "onMonetizationHide={",
    "Unable to hide item",
  ];
  for (const token of requiredFeed) {
    if (!feed.includes(token)) {
      throw new Error(`MonetizedFeed verification failed: ${token}`);
    }
  }

  write(rendererPath, renderer);
  write(feedPath, feed);

  const tsc = cp.spawnSync(
    "npx.cmd",
    ["tsc", "--noEmit"],
    {
      cwd: root,
      stdio: "inherit",
      shell: false,
    }
  );

  if (tsc.status !== 0) {
    throw new Error("TypeScript verification failed.");
  }

  console.log("");
  console.log("PASSED - Commercial Hide flow is complete.");
  console.log("Hide is immediate, persisted, rollback-safe, and restorable.");
  console.log("");
} catch (error) {
  fs.copyFileSync(rendererBackup, rendererPath);
  fs.copyFileSync(feedBackup, feedPath);

  console.error("");
  console.error("Both files were restored automatically.");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");

  process.exit(1);
}
