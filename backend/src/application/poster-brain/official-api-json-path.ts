const MAXIMUM_PATH_TOKENS =
  32;

const FORBIDDEN_PATH_TOKENS =
  new Set([
    "__proto__",
    "prototype",
    "constructor",
  ]);

function tokenize(
  path:
    string
): readonly string[] {
  const cleaned =
    path
      .trim()
      .replace(
        /^\$\./,
        ""
      )
      .replace(
        /\[(\d+)\]/g,
        ".$1"
      );

  if (!cleaned) {
    throw new Error(
      "Official API JSON path cannot be empty."
    );
  }

  const tokens =
    cleaned
      .split(".")
      .map(
        token =>
          token.trim()
      );

  if (
    tokens.length >
    MAXIMUM_PATH_TOKENS
  ) {
    throw new Error(
      "Official API JSON path is too deep."
    );
  }

  for (const token of tokens) {
    if (
      !token ||
      FORBIDDEN_PATH_TOKENS.has(
        token
      )
    ) {
      throw new Error(
        "Official API JSON path contains an unsafe token."
      );
    }
  }

  return tokens;
}

export function readPosterBrainOfficialApiJsonPath(
  value:
    unknown,

  path:
    string
): unknown {
  let current =
    value;

  for (const token of tokenize(path)) {
    if (Array.isArray(current)) {
      if (!/^\d+$/.test(token)) {
        return undefined;
      }

      const index =
        Number(token);

      current =
        current[index];

      continue;
    }

    if (
      current === null ||
      typeof current !==
        "object"
    ) {
      return undefined;
    }

    if (
      !Object.prototype
        .hasOwnProperty
        .call(
          current,
          token
        )
    ) {
      return undefined;
    }

    current =
      (
        current as
          Record<
            string,
            unknown
          >
      )[token];
  }

  return current;
}

export function readPosterBrainOfficialApiJsonArray(
  value:
    unknown,

  path:
    string
): readonly unknown[] | null {
  const result =
    readPosterBrainOfficialApiJsonPath(
      value,
      path
    );

  return Array.isArray(result)
    ? result
    : null;
}