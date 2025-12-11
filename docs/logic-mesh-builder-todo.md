# Logic Mesh Builder – Integration TODO

A checklist to wire the LogicMeshBuilder into the app and finish related refactors.

## 1) Wire LogicMeshBuilder to EngineService

- [x] Inject LogicMeshBuilder creation in EngineService after Scene is ready
    - [x] Accept map size and tilesByKey as inputs (same shape used by TerrainMeshBuilder)
    - [x] Construct: `const logic = new LogicMeshBuilder(scene, size, tilesByKey).build()`
    - [x] Store a reference on EngineService (e.g., `this.logicMesh`)
    - [x] Manage lifecycle: rebuild/dispose on scene recreation or map reload
- [x] Surface event subscriptions via EngineService
    - [x] Forward hover/exit to a small reactive store (hovered tile)
    - [x] Ensure callbacks receive the actual Tile instance
    - [x] Add convenience helpers: `onTileHover`, `onTileExit`, `onTileClick`, `onTileContextMenu` on EngineService returning unsubscribe functions
- [x] Add a debug toggle to EngineService
    - [x] Method: `setLogicDebugEnabled(enabled: boolean)` calling `logic.setDebugEnabled(enabled)`
    - [x] Add to GameMenu-component as an option

## 2) Refactor tileHeight() behavior

- [ ] Adjust `tileHeight()` to return (existing default behaviour unchanged)
    - [ ] The mid‑value height for land tiles (center height, not peaks)
    - [ ] `waterLevel` for water tiles
- [ ] Verify TerrainMeshBuilder continues to render correctly
    - [ ] Ensure the global water plane (createWaterMesh) remains aligned to `waterLevel`

## 3) Wire hover handler to TileDetails component

- [x] Create a small reactive store/composable for hovered tile (e.g., `useHoveredTile()`)
- [x] In EngineService, on `onTileHover` → set hovered tile; on `onTileExit` → clear
- [x] Update `TileDetails` component to read from the hovered tile store
    - [x] Render basic live details of the hovered tile (key, coords, types)

## 4) Housekeeping and follow‑ups

- [x] Prevent default context menu in logic click handler when using right‑click (only when a consumer opts in)
- [ ] Consider chunking very large maps into multiple thin‑instance meshes to reduce pick cost
    - Reference WorldSizes for allowed sizes
- [ ] Unify hex sizing/orientation constants in one place (math.ts is the source of truth)
- [ ] Add unit tests for `tileCenter()` alignment between Terrain and Logic meshes
- [ ] Add a development overlay option (when debug enabled) to draw hovered instance index and key
    - This belongs in TileDetails
- [ ] Ensure `dispose()` cleans observers and meshes (already done in builder; verify EngineService lifecycle too)
- [ ] Document the public API of LogicMeshBuilder in a short MD file for other teammates
