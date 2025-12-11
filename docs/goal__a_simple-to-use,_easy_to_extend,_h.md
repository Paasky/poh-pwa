Feature instancing — TODO checklist
FeatureInstancer.ts

Legend

- ✅ = done
- ❓ = needs decision/design
- 🏗️ = in progress

Core architecture

- ✅ Always create FeatureInstancer on engine boot; build on construct (no manual build calls).
- ✅ No nullable core props; masters/root always exist; hide masters, render via thin instances.
- ✅ Parent features under terrain root (EngineService sets parent on init).
- ✅ Visibility toggle via settings option showFeatures; live-applied through EngineService.applyOptions.
- ✅ Dispose FeatureInstancer on EngineService.detach.
- ✅ Get parent node in constructor to avoid pre-parent build; EngineService passes terrain root on init.
  - Started: 2025-12-11 10:56
  - Done: 2025-12-11 10:56

Placement and behavior

- ✅ Place at tileCenter with tileHeight(forLogic); stable per-tile variance for rotation/scale.
- Clustered placement per tile with per-type densities (e.g., forest 6–10, jungle 8–12) using seeded RNG.

Features and materials

- ✅ Forest (leaf) supported via thin instances of base mesh children.
- Add more feature types: pineForest, jungle, shrubs, kelp (under water), ice (large variation in sizes), atoll (single
  mesh), oasis (circle of palms).
- Central Feature→Mesh factory map; select master per type.
- Per-type material/tint support (use assets/materials/features.ts) and room for FX later.

Runtime updates

- Implement updateTiles with partial rebuild per affected type using byTile mapping.
- Full rebuild is not an acceptable solution, keep a Record<GameKey, integer> of Tile.key: mesh index

Performance and culling

- Reuse buffers where possible to reduce GC during rebuilds.
- Use sps for performance, it can handle tens/hundreds of thousands of instanced children

API surface and consistency

- ✅ Minimal API: (no setParent!), setIsVisible, updateTiles, dispose.
- Align naming in docs/code (use setIsVisible/showFeatures consistently; avoid setEnabled in examples).
- Document that instances are non-pickable; LogicMesh handles interactions.

Related layers

- ResourceInstancer: completely ignore for now.
- Non-3D surface features (floodPlain, lagoon, swamp, tradeWind, oasis decals) will get their own mesh later.

UI, settings, and tests

- Wire showFeatures toggle into UI/settings store if not already exposed.
- No tests at this stage.

Housekeeping

- Replace remaining inline TODO comments with tracked tasks referencing this checklist.