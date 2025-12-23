import { Color3 } from "@babylonjs/core";

export enum OverlayColorId {
  MOVE = "move",
  VALID = "valid",
  DANGER = "danger",
  INTEREST = "interest",
  RECOMMEND = "recommend",
  TARGET = "target",
}

export const OVERLAY_COLORS: Record<OverlayColorId | string, Color3> = {
  [OverlayColorId.MOVE]: new Color3(1, 1, 1),
  [OverlayColorId.VALID]: new Color3(0, 1, 0),
  [OverlayColorId.DANGER]: new Color3(1, 0, 0),
  [OverlayColorId.INTEREST]: new Color3(1, 1, 0),
  [OverlayColorId.RECOMMEND]: new Color3(0.2, 0.8, 0.2),
  [OverlayColorId.TARGET]: new Color3(1, 0.2, 0.2),
};

export const OVERLAY_LAYERS = {
  MOVEMENT_RANGE: "movement_range",
  MOVEMENT_PATH: "movement_path",
  MOVEMENT_PREVIEW: "movement_preview",
  SELECTION: "selection",
} as const;

export const getOverlayAlpha = (scale: number): number => 0.3 + (scale - 0.25) * 0.5;
