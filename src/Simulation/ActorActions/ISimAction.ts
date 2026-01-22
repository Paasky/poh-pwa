import { PohMutation } from "@/Common/PohMutation";

export interface ISimAction {
  validateAction(): this;
  handleAction(): PohMutation[];
}
