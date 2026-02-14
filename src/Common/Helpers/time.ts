export function formatSaveDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const yearsPerTurnConfig = [
  { start: -10000, end: -7000, yearsPerTurn: 60 },
  { start: -7000, end: -4000, yearsPerTurn: 60 },
  { start: -4000, end: -2500, yearsPerTurn: 30 },
  { start: -2500, end: -1000, yearsPerTurn: 30 },
  { start: -1000, end: -250, yearsPerTurn: 15 },
  { start: -250, end: 500, yearsPerTurn: 15 },
  { start: 500, end: 1000, yearsPerTurn: 10 },
  { start: 1000, end: 1400, yearsPerTurn: 8 },
  { start: 1400, end: 1600, yearsPerTurn: 4 },
  { start: 1600, end: 1700, yearsPerTurn: 2 },
  { start: 1700, end: 1775, yearsPerTurn: 1.5 },
  { start: 1775, end: 1850, yearsPerTurn: 1.5 },
  { start: 1850, end: 1900, yearsPerTurn: 1 },
  { start: 1900, end: 1950, yearsPerTurn: 1 },
  { start: 1950, end: 1975, yearsPerTurn: 0.5 },
  { start: 1975, end: 2000, yearsPerTurn: 0.5 },
  { start: 2000, end: 2015, yearsPerTurn: 0.333 },
  { start: 2015, end: 2030, yearsPerTurn: 0.333 },
  { start: 2030, end: 99999999, yearsPerTurn: 0.333 },
];

export function getYearFromTurn(turn: number): number {
  // Start from the first configured era
  if (turn <= 0) return yearsPerTurnConfig[0].start;

  let remainingTurns = turn;

  for (const era of yearsPerTurnConfig) {
    const yearsInEra = era.end - era.start;
    const turnsInEra = yearsInEra / era.yearsPerTurn;

    if (remainingTurns >= turnsInEra) {
      // Consume this whole era's turns and continue to the next
      remainingTurns -= turnsInEra;
      continue;
    }

    // We are within this era
    return era.start + remainingTurns * era.yearsPerTurn;
  }

  // Fallback: if for some reason we exceeded the configuration,
  // continue using the last era's yearsPerTurn indefinitely
  const last = yearsPerTurnConfig[yearsPerTurnConfig.length - 1];
  return last.start + remainingTurns * last.yearsPerTurn;
}

export function formatYear(year: number): string {
  const fullYear = Math.round(year);
  if (fullYear < 0) return `${-fullYear} BCE`;
  // Switch to just the year at year 1000
  if (fullYear < 1000) return `${fullYear} CE`;

  // Switch to seasons at the year 1950 (starts to have half/third years)
  if (fullYear < 1950) return `${fullYear}`;

  // Round to season based on fractional part of the year
  //  .875 to .125 = Winter
  //  .125 to .375 = Spring
  //  .375 to .625 = Summer
  //  .625 to .875 = Autumn
  // Compute a positive fractional part in [0, 1)
  const fracRaw = year - Math.floor(year);
  const frac = ((fracRaw % 1) + 1) % 1;

  let season: string;
  if (frac >= 0.875 || frac < 0.125) season = "Winter";
  else if (frac < 0.375) season = "Spring";
  else if (frac < 0.625) season = "Summer";
  else season = "Autumn";

  return `${season} ${fullYear}`;
}

/**
 * Maps hour (0-23) to 2400-format (0-2300).
 */
export function hourTo2400(hour: number): number {
  const hh = Math.max(0, Math.min(23, Math.round(hour)));
  return hh * 100;
}

/**
 * Maps 2400-format (0-2300) to hour (0-23).
 */
export function hourFrom2400(val2400: number): number {
  return Math.round((val2400 ?? 0) / 100);
}

/**
 * Formats an hour (0-23) as "HH:00".
 */
export function formatHour(h: number): string {
  const hh = Math.max(0, Math.min(23, Math.round(h)));
  return `${hh.toString().padStart(2, "0")}:00`;
}
