export function formatUserCount(
  value:
    number |
    null |
    undefined
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return new Intl.NumberFormat().format(
    value
  );
}

export function formatGeneratedAt(
  value:
    string |
    null |
    undefined
): string {
  if (
    !value
  ) {
    return "Not available";
  }

  const date =
    new Date(
      value
    );

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return "Invalid timestamp";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "medium",
    }
  ).format(
    date
  );
}

export function formatWindow(
  value: number,
  singular: string,
  plural: string
): string {
  return `${value} ${
    value === 1
      ? singular
      : plural
  }`;
}
