import { ref } from "vue";
import { defaultTimeOfDay2400 } from "@/components/Engine/environments/timeOfDay";

/**
 * Ultra‑simple shared clock state for the environment.
 * Single source of truth for time of day and running state.
 */
export const timeOfDay2400 = ref<number>(defaultTimeOfDay2400); // 0..2400
export const isClockRunning = ref<boolean>(true);
// How many in‑game hours advance per one real minute when clock runs.
export const clockHoursPerRealMinute = ref<number>(60.0); // 1 hour per second by default

export function clampTime2400(v: number): number {
  const x = Math.round(v);
  if (x < 0) return 0;
  if (x > 2400) return 2400;
  return x;
}

export function wrapTime2400(v: number): number {
  let x = Math.round(v);
  while (x < 0) x += 2400;
  while (x >= 2400) x -= 2400;
  return x;
}
