import { ref } from "vue";
import { defaultTimeOfDay2400 } from "@/Actor/Human/Environment/timeOfDay";
import { wrapInclusive } from "@/Common/Helpers/math";

/**
 * Ultra‑simple shared clock state for the environment.
 * Single source of truth for time of day and running state.
 */
export const timeOfDay2400 = ref<number>(defaultTimeOfDay2400); // 0..2400
export const isClockRunning = ref<boolean>(true);
// How many in‑game hours advance per one real minute when clock runs.
export const clockHoursPerRealMinute = ref<number>(60.0); // 1 hour per second by default

export function wrapTime2400(v: number): number {
  return wrapInclusive(Math.round(v), 0, 2399);
}
