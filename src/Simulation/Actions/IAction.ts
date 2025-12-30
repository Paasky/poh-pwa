import { IMutation } from "@/Common/IMutation";

export interface IAction {
  validateAction(): this;
  handleAction(): IMutation[];
}
