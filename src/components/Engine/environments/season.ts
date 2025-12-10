/**
 * Season defaults and helpers.
 * Month indexing follows 1..12 (January=1, December=12).
 */

/** Default season month index (June = 6 → early summer). */
export const defaultSeasonMonth1to12: number = 6;

/** Normalize a month index to the inclusive range 1..12. */
export const normalizeSeasonMonth1to12 = (monthIndex1to12: number): number => {
  const roundedMonthIndex = Math.round(monthIndex1to12);
  const zeroBased = ((roundedMonthIndex - 1) % 12 + 12) % 12;
  return zeroBased + 1;
};

/** Helper that returns a descriptive label for the given month index. */
export const labelForSeasonMonth = (monthIndex1to12: number):
  | "winter"
  | "spring"
  | "summer"
  | "autumn" => {
  const month = normalizeSeasonMonth1to12(monthIndex1to12);
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
};
