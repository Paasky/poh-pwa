import { IMutation } from "@/Common/IMutation";

export interface IActionHandler {
  validateAction(): this;
  handleAction(): IMutation[];
}
