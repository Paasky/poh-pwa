import { Color3, Color4 } from "@babylonjs/core";

export const EngineGroups = {
  world: 0,
  guidance: 1,
  units: 2,
  details: 3,
} as const;

/**
 * EngineLayers defines the stacking order of all 3D elements.
 * - group: (renderingGroupId) Global Z-index (0-3). Higher renders on top.
 * - offset: (zOffset) Material-level pull towards camera to prevent Z-fighting on flat planes.
 */
export const EngineLayers = {
  // Rendering Group Definitions & Offsets
  terrain: { id: "terrain", group: EngineGroups.world, offset: 0 },
  water: { id: "water", group: EngineGroups.world, offset: 1 },
  features: { id: "features", group: EngineGroups.world, offset: 2 },
  constructions: { id: "constructions", group: EngineGroups.world, offset: 3 },
  grid: { id: "grid", group: EngineGroups.guidance, offset: 0 }, // togglable visual hex grid
  guidance: { id: "guidance", group: EngineGroups.guidance, offset: 1 }, // paths, selection markers, etc
  units: { id: "units", group: EngineGroups.units, offset: 0 },
  details: { id: "details", group: EngineGroups.details, offset: 0 }, // health bars, tile icons, etc

  // Tactical Layer IDs (for setLayer calls)
  movementRange: "movementRange",
  movementPath: "movementPath",
  movementPreview: "movementPreview",
  movementCosts: "movementCosts",
  selection: "selection",
} as const;

export type EngineColorId = "move" | "valid" | "danger" | "target" | "grid" | "selection";

export const EngineColors = {
  // UI & Overlay Colors
  move: "#ffffff",
  valid: "#22c55e",
  danger: "#ef4444",
  target: "#eab308",
  grid: "#ffffff",
  selection: "#ffffff",

  // Terrain Mapping
  terrain: {
    grass: "#3f6212",
    snow: "#ffffff",
    desert: "#d1d143",
    ocean: "#172554",
    coast: "#3d73a5",
    lake: "#505d67",
    majorRiver: "#50675e",
    plains: "#81791c",
    sea: "#1e3a8a",
    rocks: "#484848",
    tundra: "#3b5118",
  },
} as const;

export const EngineAlpha = {
  grid: 1,
  movementRange: 0.2,
  movementPath: 1,
  movementPreview: 1,
  selectionRing: 1,
} as const;

export const EnginePathStyles = {
  movementPath: {
    width: 2,
    type: "line" as "line" | "dash" | "dotted",
    curvature: 0.3,
  },
  movementPreview: {
    width: 2,
    type: "dotted" as "line" | "dash" | "dotted",
    curvature: 0.3,
  },
} as const;

export const EngineOverlaySettings = {
  pathHeight: 0,
  pathSmoothingSteps: 10,
  pathWidthFactor: 0.025, // 1/40
  detailHeight: 0,
  guidanceHeight: 0,
  detailFontSize: 16,
  detailIconSize: 16,
  detailOutlineWidth: 1,
  detailIconOutlineWidth: 3,
  detailIconWidth: "24px",
} as const;

// Helper to convert hex to Babylon Color3/4
export const toColor3 = (hex: string) => Color3.FromHexString(hex);
export const toColor4 = (hex: string, alpha: number = 1) =>
  Color4.FromHexString(
    `${hex}${Math.floor(alpha * 255)
      .toString(16)
      .padStart(2, "0")}`,
  );

export const EngineOverlayColors: Record<EngineColorId, Color3> = {
  move: toColor3(EngineColors.move),
  valid: toColor3(EngineColors.valid),
  danger: toColor3(EngineColors.danger),
  target: toColor3(EngineColors.target),
  grid: toColor3(EngineColors.grid),
  selection: toColor3(EngineColors.selection),
};
