# Overlay Refactoring Action Plan

## Core Principles

### KISS & DRY

- **KISS (Keep It Simple, Stupid)**: Simplicity is beauty. Avoid over-engineering.
- **DRY (Don't Repeat Yourself)**: Centralize shared logic, constants, and math to prevent duplication and logic drift.

### Refactor Context

We are in the middle of a major refactor, migrating from legacy code (e.g., `FogOfWar.ts`, `movementOverlay`) to a
unified, performance-oriented overlay system (`ContextOverlay`, `PathOverlay`, `MarkerOverlay`).

### Project Rules

1. **KISS**: Simplicity is beauty.
2. **Standard Practices**: Keep to industry standards and common practices.
3. **No Hacks**: No wild hacks to get around an existing problem: fix/remove the problem.
4. **Verbose Naming**: No cryptic 1-2 letter variables. Be verbose and use English.
5. **No `any`**: In JS/TS, no casting to `any` at any time. Be precise.
6. **Reuse Types**: Don't create new types for i/o definitions: find and use existing types.
7. **Helper Centralization**: Don't duplicate math/helpers locally; they belong in `helpers`.
8. **No Mocking**: Strictly no mocking in tests (exceptions: `Math.random` faker, stateless Babylon engine, external
   network/file interactions).
9. **Push Back**: If a request goes against these rules, push back once.

---

## 1. Shared Infrastructure

### 1.1 Create `IOverlay` Interface

- **What**: Define a standard TypeScript interface for all overlay classes.
- **Why**: Enables polymorphic handling in `EngineService` and justifies common methods to suppress IDE warnings.
- **Where**: `src/components/Engine/overlays/IOverlay.ts`.
- **How**:

```typescript
export interface IOverlay<T = any> {
  setLayer(id: string, payload: T | null): this;
  showLayer(id: string, isEnabled: boolean): void;
  setScaling?(scale: number): void;
  dispose(): void;
}
```

- **Tests**:
    - `PathOverlay`, `MarkerOverlay`, and `ContextOverlay` implement this interface without type errors.

### 1.2 Create `OverlayConstants`

- **What**: Centralize color definitions, layer IDs, and shared scaling formulas.
- **Why**: Resolves DRY violations and ensures visual consistency.
- **Where**: `src/components/Engine/overlays/OverlayConstants.ts`.
- **How**:

```typescript
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

export const getOverlayAlpha = (scale: number): number => 
  0.3 + (scale - 0.25) * 0.5;
```

- **Tests**:
    - All color IDs used in `useMovementInteraction` are present in `OverlayColorId`.

---

## 2. Overlay Implementations

### 2.1 Refactor `PathOverlay`

- **What**: Implement `IOverlay`, add material caching, use shared constants, and apply `readonly`.
- **Why**: Material reuse prevents GPU memory churn and shader re-compilation. `readonly` ensures state safety.
- **Where**: `src/components/Engine/overlays/PathOverlay.ts`.
- **How**:
    - Implement `IOverlay<PathPayload>`.
    - Add `private readonly materialCache: Map<string, StandardMaterial> = new Map()`.
    - Update `setLayer` to use `getMaterial(colorId: string)` pulling from `materialCache` and `OVERLAY_COLORS`.
    - Update `setScaling` to use `getOverlayAlpha(scale)`.
- **Tests**:
    - Drag unit path for 60s; `scene.materials.length` remains constant.
    - Path transparency changes correctly on zoom.

### 2.2 Refactor `MarkerOverlay`

- **What**: Fix abstract class instantiation, implement `IOverlay`, and apply `readonly`.
- **Why**: `AbstractMesh` cannot be instantiated. `TransformNode` is the correct lightweight object for GUI anchors.
- **Where**: `src/components/Engine/overlays/MarkerOverlay.ts`.
- **How**:
    - Replace `new AbstractMesh(...)` with `new TransformNode(...)`.
    - Mark `scene`, `root`, `guiTexture`, `markerMeshes`, `labels`, `labelGhosts` as `readonly`.
    - Use `getOverlayAlpha(scale)` in `setScaling`.
- **Tests**:
    - Selection rings appear correctly.
    - Labels follow camera and center over units.

### 2.3 Refactor `ContextOverlay`

- **What**: Merge legacy Fog of War logic, centralize shader math, and resolve linting/readonly warnings.
- **Why**: Eliminates duplicated hex math and ensures FoW settings toggle the post-process.
- **Where**: `src/components/Engine/overlays/ContextOverlay.ts`.
- **How**:
    - Define hex math in `Effect.IncludesShadersStore["hexMath"]` within `registerShader()`.
    - Replace inline math in fragment shader with `#include<hexMath>`.
    - Update `attachToCamera` to detach/attach post-process based on `isFoWEnabled`.
- **Tests**:
    - Toggle "Enable Fog of War" in settings; verify visual transition.
    - Area highlights align with hex boundaries.

---

## 3. Integration & API Alignment

### 3.1 Update `MainCamera`

- **What**: Reorder constructor arguments and integrate scaling for all overlays.
- **Why**: Standardizes dependency injection and ensures all visuals respond to zoom.
- **Where**: `src/components/Engine/interaction/MainCamera.ts`.
- **How**:
    - Update constructor:
      `constructor(size, scene, canvas, getKnownBounds, contextOverlay, gridOverlay, markerOverlay, pathOverlay)`.
    - Update `applyZoomEffects` to call `setScaling` on `markerOverlay` and `pathOverlay`.
- **Tests**:
    - Max zoom: lines/markers become thicker/more opaque.
    - Min zoom: lines/markers become thinner/more transparent.

### 3.2 Update `Minimap`

- **What**: Replace `FogOfWar` with `ContextOverlay`.
- **Why**: Minimap must use same rendering logic as main scene.
- **Where**: `src/components/Engine/interaction/Minimap.ts`.
- **How**:
    - Replace `FogOfWar` references with `ContextOverlay`.
    - Call `this._contextOverlay.attachToCamera(this._camera)` in constructor.
- **Tests**:
    - Minimap shows area highlights (e.g. valid movement zones) during selection.

### 3.3 Update `EngineService` Lifecycle

- **What**: Update initialization sequence and camera/minimap instantiation.
- **Why**: Ensures `ContextOverlay` is ready before being passed to consumers.
- **Where**: `src/components/Engine/EngineService.ts`.
- **How**:
    - Update `initCamera` and `initMinimap` signatures.
    - Remove legacy `FogOfWar` property and imports.
- **Tests**:
    - App boots without console errors.

### 3.4 Refactor `useMovementInteraction`

- **What**: Use new granular overlay API instead of deprecated `movementOverlay`.
- **Why**: Restore movement visuals using improved multi-layer system.
- **Where**: `src/composables/useMovementInteraction.ts`.
- **How**:
    - Replace `overlay.setReachableTiles` with `contextOverlay.setLayer(OVERLAY_LAYERS.MOVEMENT_RANGE, ...)`.
    - Replace path updates with `pathOverlay.setLayer(OVERLAY_LAYERS.MOVEMENT_PATH, ...)`.
- **Tests**:
    - Select Unit: Reachable range (Context), selection ring (Marker), and path (Path) appear.

---

## 4. Decommissioning

### 4.1 Delete Legacy FogOfWar

- **What**: Delete `src/components/Engine/FogOfWar.ts`.
- **Why**: Redundant code; logic merged into `ContextOverlay.ts`.
- **Tests**:
    - `npm run build` or `tsc` confirms no lingering imports.
