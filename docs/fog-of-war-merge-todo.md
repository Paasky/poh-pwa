# Fog of War merge into master — TODO plan

Branches compared

- base: master (f760dad, "settings")
- compare: origin/fog-of-war (ab34f7b, "fow")

High-level summary

- Feature: Adds Fog of War (FoW) rendering/post-process and integrates it with Minimap and camera flow.
- Engine refactor: Introduces MainCamera helper, consolidates terrain/logic mesh builders, new options plumbing.
- Removals: World.ts and ElevationBlender.ts deleted in FoW branch; corresponding references must be excised.

Change summary (git diff --name-status master...origin/fog-of-war)

- M package.json
- M pnpm-lock.yaml
- M src/components/Engine/EngineService.ts ← merge conflict
- M src/components/Engine/FogOfWar.ts
- M src/components/Engine/features/FeatureInstancer.ts
- A src/components/Engine/interaction/MainCamera.ts
- M src/components/Engine/interaction/Minimap.ts
- D src/components/Engine/terrain/ElevationBlender.ts
- M src/factories/worldFactory.ts
- M src/helpers/mapTools.ts
- M src/helpers/math.ts
- M src/objects/game/Player.ts
- D src/objects/game/World.ts
- M src/stores/appStore.ts
- M src/stores/objectStore.ts
- M src/types/common.ts
- M src/views/TestView.vue

Files with merge conflicts (attempted non-committing merge):

- src/components/Engine/EngineService.ts

Resolution plan (ordered)

1) EngineService.ts (conflicts and integration)
    - Imports conflict:
        - HEAD imports GridOverlay.
        - FoW branch imports FogOfWar, Tile, GameKey, Coords, Unit.
        - Action:
            - Keep FogOfWar import and supporting types.
            - Keep GridOverlay support if the hex grid overlay is still desired by UX; otherwise, remove the overlay
              option entirely. Given master has EngineOptions.showGrid and UI likely references it, prefer to keep
              GridOverlay.
            - Ensure Coords is imported from helpers/mapTools at top (used by size: Coords).
    - Class fields conflict:
        - HEAD: gridOverlay: GridOverlay
        - FoW: fogOfWar: FogOfWar
        - Action: Keep both fields if the grid overlay stays; otherwise remove gridOverlay field and all related code
          paths. Recommendation: keep both.
    - Constructor block conflict:
        - HEAD creates GridOverlay using this.world.sizeX/sizeY, but world property no longer exists in the refactored
          pipeline.
        - FoW branch initializes FogOfWar using currentPlayer.knownTileKeys/visibleTileKeys from object store; then
          calls flyToFirstUnitTile().
        - Action:
            - Initialize fogOfWar exactly as in FoW branch: new FogOfWar(this.size, this.scene, this.camera, tilesByKey,
              knownKeys, visibleKeys).
            - Recreate GridOverlay with new dims: new GridOverlay(this.scene, { x: this.size.x, y: this.size.y },
              tilesByKey) and set visibility from options.showGrid.
            - Ensure Minimap is created with fogOfWar dependency: new Minimap(this.size, minimapCanvas, this.engine,
              this.fogOfWar).
    - Options application conflict:
        - HEAD toggles grid overlay via this.gridOverlay.setVisible on options.showGrid change.
        - Action: Keep this live toggle only if grid overlay is kept. If removing overlay, also remove
          EngineOptions.showGrid and all references (touches UI and store).
    - Method block conflict ("Live toggles" + getters delegation):
        - HEAD contains private setManualTilt and a set of getters/setters delegating to EnvironmentService.
        - The class already uses MainCamera.setManualTilt in applyOptions; the private setManualTilt is obsolete. The
          environment getters/setters are still useful for UI bindings.
        - Action:
            - Drop the private setManualTilt() method (continue using MainCamera.setManualTilt).
            - Keep the public delegation methods to EnvironmentService (get/set time, season, weather, clock state) to
              avoid breaking UI.
    - Additional integration checks:
        - Ensure imports/uses of Tile, GameKey, Unit, Coords match actual module exports.
        - Ensure there is a flyToFirstUnitTile() implementation or remove/replace it (FoW branch references it; verify
          presence in EngineService or add minimal implementation that queries object store and animates camera).

2) Minimap.ts
    - Now depends on FogOfWar to paint black rectangles over unknown tiles.
    - Action:
        - Ensure EngineService passes fogOfWar when constructing Minimap.
        - Verify math helpers used: getWorldWidth/depth/minX/minZ, hexWidth/hexDepth exist and have consistent units.

3) FogOfWar.ts
    - New PostProcess integrating a mask texture (known/visible RG channels) that dims unexplored and unknown tiles.
    - Action:
        - No merge conflicts. Ensure disposal is called from EngineService.dispose().
        - Confirm Effect.ShadersStore key and fragment code compile under current BabylonJS version.

4) Environment/Camera
    - MainCamera.ts added; EngineService delegates camera behavior to it.
    - Action:
        - Remove any residual direct camera input wiring from EngineService that MainCamera already handles.
        - Verify manualTilt option is plumbed through applyOptions to MainCamera.

5) Deletions and references
    - ElevationBlender.ts deleted.
    - World.ts deleted.
    - Action:
        - Search codebase for references to ElevationBlender and World; remove or replace. Terrain pipeline appears to
          use TerrainMeshBuilder + LogicMeshBuilder; ensure all imports updated.

6) Stores and types
    - appStore.ts, objectStore.ts, types/common.ts changed.
    - FoW relies on: useObjectsStore().currentPlayer.knownTileKeys.value and visibleTileKeys.value (arrays of GameKey).
    - Action:
        - Verify currentPlayer exists with knownTileKeys/visibleTileKeys as reactive refs (or adapt EngineService to
          correct API).
        - Ensure Tile.getKey() format matches GameKey type used in store.
        - Update UI/store wiring to persist and update FoW sets on gameplay events (movement, discovery).

7) Helpers and math
    - helpers/mapTools.ts: Coords type and possibly new utilities used in engine.
    - helpers/math.ts: world dimension helpers used by FoW and Minimap.
    - Action:
        - Ensure exported types/functions are consistent across callers (EngineService, Minimap, FogOfWar).

8) FeatureInstancer.ts
    - Modified; EngineService uses .setIsVisible(options.showFeatures).
    - Action:
        - Verify that API remains chainable and that batching/instancing options match EngineOptions defaults.

9) worldFactory.ts, Player.ts, TestView.vue
    - Action:
        - Review for FoW-related changes (e.g., initialization of known/visible keys, UI toggles).
        - Ensure worldFactory no longer depends on World.ts.

10) package.json / pnpm-lock.yaml
- Action:
    - Install updated dependencies (pnpm i) and verify babylon versions are compatible with FoW post-process usage.

11) Build & verify
- Steps:
    - Create a working branch off master: git checkout -b feature/fow-merge
    - Merge origin/fog-of-war: git merge --no-ff origin/fog-of-war
    - Resolve EngineService.ts as per above (imports, fields, constructor, applyOptions, methods) and any secondary
      compile issues.
    - Run type-check/build: pnpm run build (or dev) and fix any TS errors.
    - Manual checks:
        - FoW dims unknown/explored tiles as expected.
        - Minimap overlays unknown tiles in black rectangles.
        - Grid overlay toggle works (if kept).
        - Environment controls (time/season/weather/clock) still work via getters/setters.
        - No references to deleted World/ElevationBlender remain.

Known conflict hunks and recommended resolutions

- Imports (top of EngineService.ts):
    - Keep:
        - import { FogOfWar } from "@/components/Engine/FogOfWar";
        - import type { Tile } from "@/objects/game/Tile";
        - import type { GameKey } from "@/objects/game/_GameObject";
        - import { Coords } from "@/helpers/mapTools"; (ensure present)
    - Optionally also keep: import GridOverlay from "@/components/Engine/overlays/GridOverlay";

- Fields:
    - Keep both if overlay needed:
        - fogOfWar: FogOfWar;
        - gridOverlay: GridOverlay; (optional)

- Constructor snippet (replace conflicting section with):
    - const store = useObjectsStore();
    - const known = store.currentPlayer.knownTileKeys.value as GameKey[];
    - const visible = store.currentPlayer.visibleTileKeys.value as GameKey[];
    - this.fogOfWar = new FogOfWar(this.size, this.scene, this.camera, tilesByKey, known, visible);
    - if (minimapCanvas) this.minimap = new Minimap(this.size, minimapCanvas, this.engine, this.fogOfWar);
    - if (options?.showGrid) { create GridOverlay with { x: this.size.x, y: this.size.y } and tilesByKey;
      this.gridOverlay.setVisible(!!options.showGrid); }

- applyOptions():
    - Keep renderScale, fpsCap, manualTilt (via this.mainCamera.setManualTilt), showFeatures toggles.
    - For showGrid: only keep if GridOverlay retained; otherwise remove conditional.

- Method block:
    - Remove private setManualTilt().
    - Keep public getters/setters delegating to EnvironmentService (get/set time, season, weather, clock), as used by
      UI.

Potential pitfalls

- Using this.world.* in GridOverlay construction: replace with this.size.x/this.size.y and tilesByKey.
- Store API differences: if knownTileKeys/visibleTileKeys are Sets or computed, adapt to arrays for FogOfWar
  constructor.
- Shader registration name collisions: ensure FogOfWar’s Effect.ShadersStore keys do not conflict with existing ones.
- Performance: FoW mask update writes w*h*4 bytes; throttle/process only on visibility changes, not every frame.

Post-merge checklist

- [ ] App compiles (type-check passes)
- [ ] Engine scene renders; no missing imports
- [ ] FoW mask correctly dims explored/unknown tiles
- [ ] Minimap draws unknown tiles overlay
- [ ] Grid overlay toggle works (if kept)
- [ ] No references to World.ts or ElevationBlender.ts remain
- [ ] Store exposes currentPlayer known/visible keys as expected
- [ ] Unit navigation updates visibility and known sets
- [ ] README/docs updated if UX toggles changed
