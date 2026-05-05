export function formatAnswerForDisplay(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) {
    return value.map((item) => formatAnswerForDisplay(item)).filter(Boolean).join(", ");
  }

  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed
    .split(",")
    .map((part) => {
      const item = part.trim();
      const key = item.replace(/[\s_-]+/g, "").toUpperCase();
      if (key === "NOTGIVEN") return "NOT GIVEN";
      if (key === "TRUE" || key === "FALSE" || key === "YES" || key === "NO") return key;
      return item;
    })
    .join(", ");
}
