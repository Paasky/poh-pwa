### Pathfinder Architecture Design

This document outlines the architecture for the pathfinding system in "Pages of History". The goal is a KISS (Keep It
Simple, Stupid) implementation that leverages Vue 3's reactivity and BabylonJS for efficient rendering.

#### 0. Preparation: Dependencies

Add the following dependencies:

* `pnpm add tinyqueue@3`
    * **Rationale**: A minimal, high-performance priority queue for the A* implementation.
* `pnpm add @babylonjs/gui@^8.41.2`
    * **Rationale**: Required for **Turn Markers**. Unlike standard meshes, Babylon GUI elements are managed in a
      screen-space or world-space overlay that ignores camera distance for scaling, ensuring that turn numbers (e.g., "(
      1)", "(2)") remain perfectly legible and topmost regardless of zoom level.
    * **Version**: Must match `@babylonjs/core` version (currently `^8.41.2`).

#### 1. Core Logic: `PathfinderService`

**File: `src/services/PathfinderService.ts` [CREATE]**

A standalone TypeScript service responsible for calculating optimal paths.

* **Rationale**: Decoupling pathfinding logic from the `Unit` class keeps the game model lean and ensures the algorithm
  is easily testable in isolation.
* **Algorithm**: **A*** using a priority queue.
* **Cost Integration**: Consumes `Unit.moveCost(to, from, context)`.
* **Lifecycle & Ownership**:
    * **Constructor**: Run once during `EngineService.init()`.
    * **Instance**: Lives as a member of `EngineService` (`this.pathfinder`).
    * **Lifespan**: Persistent for the duration of the game session (until `EngineService.dispose()`).
* **Multi-Turn Logic**:
    * Tracks `cumulativeCost` and `currentMovesRemaining`.
    * When `moveCost > currentMovesRemaining`:
        * Increments a `turn` counter.
        * Resets `currentMovesRemaining` to the unit's maximum moves.
    * **Unknown Tile Constraint**: If `turn > 0` (multi-turn path) and the tile is not in `context.known`, the path is
      considered blocked.
    * **Friendly Unit Constraint**: A path step is considered blocked if:
        1. It is the final destination of the path AND the tile contains a friendly unit.
        2. It is a tile where a turn ends (current moves depleted) AND the tile contains a friendly unit.
* **Output Structure**:
  ```typescript
  /** Data structure representing a single step in a calculated path */
  export type PathStep = {
    /** The tile at this step */
    tile: Tile;
    /** The turn number this step is reached on (0 = current turn) */
    turn: number;
    /** Flag indicating a turn ends on this tile; used to render Turn Markers */
    isTurnEnd: boolean;
    /** Movement points remaining after reaching this tile */
    movesRemaining: number;
  }

  /** Pathfinder API */
  export class PathfinderService {
    /** Constructor is stateless for MVP */
    constructor() {}

    /**
     * Calculates the optimal path from start to target.
     * Consumes Unit.moveCost(to, from, context).
     */
    findPath(unit: Unit, target: Tile, context: MoveContext): PathStep[] { /* ... */ }

    /**
     * Returns all tiles reachable within the current turn's remaining moves.
     */
    getReachableTiles(unit: Unit, context: MoveContext): Set<GameKey> { /* ... */ }
  }
  ```

#### 2. State Management: `useMoveMode`

**File: `src/composables/useMoveMode.ts` [CREATE]**

A Vue-based composable that bridges Game Objects and the Engine.

* **Rationale**: Centralizing the "Move Mode" state in a composable allows Engine overlays to reactively update without
  direct coupling to interaction logic, adhering to the project's standard pattern for UI/Engine bridges.
* **Lifecycle & Ownership**:
    * **Initialization**: Created as a singleton-like state (usually exported as a shared composable instance or
      initialized in `App.vue`).
    * **Lifespan**: Persistent across the entire application lifecycle.
* **API Usage (Getters/Setters)**:
    * **State Container**: `useMoveMode` is a passive state container (refs).
    * **Controller**: `EngineService` acts as the controller, watching `hoveredTile` and `selectedTile` to trigger
      `PathfinderService` and update `useMoveMode` refs.
    * **Consumers**: `MovementOverlay` (reads `reachableTiles`, `potentialPath`, `currentPath`), UI Components (read
      `activeUnit` for status displays).
    * **Trigger**: Updates automatically when `selectedTile` or `hoveredTile` changes (via watchers in `EngineService`).
* **Automatic Activation**: If `selectedTile` contains a unit owned by the player, `EngineService` sets `activeUnit` and
  enables "Move Mode."
* **Reachable Tiles**: Recalculated by `EngineService` using `PathfinderService.getReachableTiles()` whenever
  `activeUnit` changes.
* **Paths**:
    * **Potential Path**: Follows `hoveredTile`. `EngineService` calls `PathfinderService.findPath()` and updates the
      ref.
    * **Current Path**: The path currently assigned to the unit (if any, e.g. for multi-turn moves). Read from unit
      state.

```typescript
/** Move Mode Composable API */
export type UseMoveMode = {
  /** The unit currently selected for movement. */
  activeUnit: Ref<Unit | undefined>;

  /** Tiles reachable in the current turn. */
  reachableTiles: Ref<Set<GameKey>>;

  /** The path being followed if the hovered tile is clicked (Potential Path). */
  potentialPath: Ref<PathStep[]>;

  /** Any path already assigned to the unit (Current Path). */
  currentPath: Ref<PathStep[]>;

  /** Explicitly deactivate move mode and clear all state. */
  deactivate (): void;
}
```

#### 3. Presentation: `MovementOverlay`

**File: `src/components/Engine/overlays/MovementOverlay.ts` [CREATE]**

Discrete, high-performance visualization using `ThinInstance` and Babylon GUI.

* **Rationale**: `ThinInstance` meshes provide maximum performance for bulk highlights. Babylon GUI ensures turn markers
  remain legible and topmost regardless of camera zoom or world-space obstructions.
* **Lifecycle & Ownership**:
    * **Constructor**: Run once during `EngineService.init()`.
    * **Instance**: Owned and managed by `EngineService` (`this.movementOverlay`).
    * **Lifespan**: Created when the engine starts; disposed when the engine stops (`EngineService.dispose()`).
* **Zoom Level Clarity**:
    * **Turn Markers**: GUI elements naturally ignore camera distance for scaling.
    * **Path Lines & Breadcrumbs**: Like `GridOverlay`, these must implement scaling (e.g., via alpha or thickness
      adjustments) hooked into the `MainCamera` zoom level watchers to maintain visual clarity at all distances.
* **API Usage (Getters/Setters)**:
    * **Consumers**: Updated via `useMoveMode` watchers inside `EngineService` or directly by `EngineService` when the
      selection/hover state changes.
    * **Setter Timing**: `setReachableTiles`, `setPotentialPath`, and `setCurrentPath` are called whenever the
      corresponding reactive properties in `useMoveMode` change.
* **Reachable Highlight**:
    * **What**: Subtle overlay on tiles within movement range.
    * **Why**: Provides immediate feedback on unit capabilities.
    * **Implementation**: Uses `ThinInstance` meshes (similar to `FeatureInstancer`) with the `secondary` color (dark
      green).
* **Path Visualization**:
    * **Current Path**: Curved solid white line (Bezier or Catmull-Rom).
    * **Potential Path**: Curved dotted white line following the hover.
    * **Breadcrumbs**: Small white discs at tile centers.
    * **Turn Markers**: Uses `@babylonjs/gui` (`TextBlock`) to render labels like `(1)`, `(2)` centered on tiles where
      `isTurnEnd` is true.
* **No Ghosting**: No semi-transparent unit ghost will be rendered.

```typescript
/** Movement Overlay API */
export class MovementOverlay {
  /**
   * @param scene The BabylonJS scene
   * @param size The map dimensions for coordinate calculations
   */
  constructor (scene: Scene, size: Coords) { /* ... */ }

  /** Renders the reachable area highlight (Context Overlay) */
  setReachableTiles (keys: Set<GameKey>): void { /* ... */ }

  /** Renders the potential path (curved dotted white line) */
  setPotentialPath (path: PathStep[]): void { /* ... */ }

  /** Renders the current path (curved solid white line) */
  setCurrentPath (path: PathStep[]): void { /* ... */ }

  /**
   * Adjusts visual thickness/alpha of lines and breadcrumbs based on zoom.
   * Called by MainCamera.applyZoomEffects().
   */
  setScaling (scale: number): void { /* ... */ }

  /** Updates the selection marker position */
  setSelectionMarker (tile: Tile | undefined): void { /* ... */ }

  /** Clears and disposes all engine resources */
  dispose (): void { /* ... */ }
}
```

#### 4. Refined `MoveContext`

**File: `src/objects/game/MoveContext.ts` [CREATE]**

`MoveContext` provides external state and policy for `Unit.moveCost` calculations.

* **Rationale**:
    * **Performance**: Pathfinder (A*) calls `moveCost` thousands of times per path calculation. Passing pre-resolved,
      non-reactive properties (like `ReadonlySet` for knowledge/visibility) avoids the significant overhead of Vue 3
      dependency tracking and multiple relation traversals at each step.
    * **Stateless Algorithm**: Keeps `PathfinderService` stateless and decouples movement logic from the live Unit
      state, allowing the pathfinder to simulate moves for different players or hypothetical knowledge sets.
    * **Decoupling**: Moving the type to its own file prevents circular dependencies and keeps `Unit.ts` focused on the
      domain model.

```typescript
export type MoveContext = {
  // Visibility/knowledge policy
  /** Tile keys known by the player; used to block multi-turn paths into the unknown (fog). */
  known: ReadonlySet<GameKey>;
  /** Tile keys currently visible; used to resolve what units the player can 'see' in the path. */
  visible: ReadonlySet<GameKey>;
  /** Policy flag: if false, unit cannot enter any unknown tile even on the first turn. */
  canEnterUnknownThisTurn?: boolean;
  /** Internal A* flag: true only for tiles reachable within the unit's moves this turn. */
  isCurrentTurnStep?: boolean;

  // Board state
  /** The player performing the movement; used for relationship and domain access checks. */
  player: Player;
  /** Tiles with friendly units; allows passing through but prevents ending turn (stack limit). */
  friendlyUnitTiles: ReadonlySet<GameKey>;
  /** Tiles with enemy units; acts as an impassable barrier. */
  enemyUnitTiles: ReadonlySet<GameKey>;

  // Unit state
  /** Initial unit state override (e.g., if pathing starts from a hypothetical embarked state). */
  embarked?: boolean;
};
```

#### 4.1 Rules & Implementation

* **Who creates it?**
    * The consumer of `PathfinderService` (e.g., `useMoveMode` or an AI service) is responsible for creating the
      `MoveContext`.
    * It acts as a static "world snapshot" for the duration of a pathfinding request.
* **Why not in `Tile`?**
    * **Performance**: `Tile.units` is a reactive relation. Checking it thousands of times per second in an A* loop is
      prohibitively expensive.
    * **Visibility (Fog of War)**: A `Tile` knows all units on it, but a `Player` might not. `MoveContext` allows
      passing only the units the current player can actually see.
* **Rules**:
    * **Friendly Unit**: Same player or ally. `friendlyUnitTiles` should include all tiles where such units are visible.
    * **Enemy Unit**: Players at war or barbarians.
    * **Movement Logic**:
        * **Enemy**: Tiles in `enemyUnitTiles` are impassable (block movement).
        * **Friendly**: Tiles in `friendlyUnitTiles` allow pass-through but **cannot** be the final destination of a
          move if stacking is limited to 1.

#### 5. Game Engine Layering

**Files: `src/components/Engine/EngineService.ts` [MODIFY],
`src/components/Engine/overlays/GridOverlay.ts` [MODIFY],
`src/components/Engine/features/ObjectInstancer.ts` [MODIFY],
`src/components/Engine/interaction/MainCamera.ts` [MODIFY],
`src/objects/game/Unit.ts` [MODIFY]**

To ensure visual clarity (UX-first), map elements are organized into rendering groups. Overlays are prioritized for
interaction feedback.

| Layer                | Items                                      | Rendering Group | Notes                                       | Rationale                                |
|:---------------------|:-------------------------------------------|:---------------:|:--------------------------------------------|:-----------------------------------------|
| **World**            | Terrain, Features, Water                   |        0        | Depth-tested                                | Base layer for all world geometry        |
| **Grid Overlay**     | Hex grid lines                             |        1        | Above terrain, below objects                | Scale indicator; must not obscure cities |
| **Static Objects**   | Cities, Constructions                      |        2        | Immovable world objects (ObjectInstancer)   | Foundational landmarks                   |
| **Context Overlays** | Available moves (Reachable Area highlight) |        3        | Below units; "secondary" color (dark green) | Non-obtrusive action feedback            |
| **Dynamic Objects**  | Units                                      |        4        | Animated game pieces (ObjectInstancer)      | Main focal points for interaction        |
| **Current Overlay**  | Movement Path, Selection Highlight         |        5        | Topmost; white/dotted curved lines          | Critical path info; must always be clear |
| **UI Labels**        | Turn Markers, City Names                   |   Babylon GUI   | Topmost; centered on tiles; ignores groups  | Guarantees legibility at all distances   |

#### 6. Implementation Decisions

* **Reactivity**: Leveraging Vue 3's built-in reactivity and existing `LogicMeshBuilder` hover logic for performance.
* **Visibility**: `Unit.visibleTileKeys` computed property is used for OOD integrity with zero overhead when the unit
  hasn't moved.
* **Orchestration**: `EngineService.init()` initializes `PathfinderService` and `MovementOverlay`, and sets up the
  watchers that bridge `useCurrentTile` (hover/selection) to `useMoveMode` (logic) and `MovementOverlay` (visuals).
* **Fog of War**: Paths are rendered above the Fog of War for maximum UX clarity. A path is a path, regardless of
  terrain visibility.
* **Zoom support**: `MainCamera.applyZoomEffects()` is updated to call `movementOverlay.setScaling()`, ensuring path
  lines remain clear when zooming out.
