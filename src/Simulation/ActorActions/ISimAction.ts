import { IMutation } from "@/Common/IMutation";

export interface ISimAction {
  validateAction(): this;
  handleAction(): IMutation[];
}
