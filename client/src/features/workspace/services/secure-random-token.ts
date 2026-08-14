const DEFAULT_SECURE_RANDOM_BYTES = 16;

export const createSecureRandomToken = (
  byteLength = DEFAULT_SECURE_RANDOM_BYTES
): string => {
  if (
    !Number.isInteger(byteLength) ||
    byteLength <= 0
  ) {
    throw new Error(
      "Secure random token byte length must be a positive integer."
    );
  }

  const secureCrypto =
    globalThis.crypto;

  if (
    !secureCrypto ||
    typeof secureCrypto.getRandomValues !== "function"
  ) {
    throw new Error(
      "Secure randomness is unavailable."
    );
  }

  const bytes =
    new Uint8Array(
      byteLength
    );

  secureCrypto.getRandomValues(
    bytes
  );

  return Array.from(
    bytes,
    (byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
  ).join("");
};
