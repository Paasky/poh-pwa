import { wrapInclusive } from "@/Common/Helpers/math";
import { defaultTimeOfDay2400 } from "@/Actor/Human/Environment/timeOfDay";

export type ClockState = {
  timeOfDay2400: number;
  isClockRunning: boolean;
  clockHoursPerRealMinute: number;
};

export const clock: ClockState = {
  timeOfDay2400: defaultTimeOfDay2400,
  isClockRunning: true,
  clockHoursPerRealMinute: 60.0,
};

export function wrapTime2400(v: number): number {
  return wrapInclusive(Math.round(v), 0, 2399);
}
