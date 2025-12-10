/**
 * Time-of-day defaults and helpers.
 * This module intentionally exposes verbose names and avoids cryptic identifiers.
 */

/** Default time of day (24h clock encoded as 0..2400). 1400 = 2:00 PM. */
export const defaultTimeOfDay2400: number = 1400;

/** Clamp a 24-hour time integer to 0..2400 inclusive. */
export const clampTimeOfDay2400 = (timeOfDayValue2400: number): number => {
  const roundedValue = Math.round(timeOfDayValue2400);
  if (roundedValue < 0) return 0;
  if (roundedValue > 2400) return 2400;
  return roundedValue;
};

/** Wrap a 24-hour time integer so it remains within 0..2400 (modular arithmetic). */
export const wrapTimeOfDay2400 = (timeOfDayValue2400: number): number => {
  let wrappedValue = timeOfDayValue2400 % 2400;
  if (wrappedValue < 0) wrappedValue += 2400;
  return wrappedValue;
};

/** Convert hours and minutes to a 0..2400 integer (e.g., 14:30 → 1430). */
export const toTimeOfDay2400 = (hours0to23: number, minutes0to59: number): number => {
  const safeHours = Math.min(23, Math.max(0, Math.round(hours0to23)));
  const safeMinutes = Math.min(59, Math.max(0, Math.round(minutes0to59)));
  return clampTimeOfDay2400(safeHours * 100 + safeMinutes);
};
