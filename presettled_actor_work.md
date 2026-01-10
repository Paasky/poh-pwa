# Pre-Settled Stage: Actor Work

## Current Findings

- **AI Brain Initialization**: `src/Conductor/CurrentGame.ts` has a `loadActors` method, but there is no automated logic
  in `newGameTask` to create `Brain` instances for all players defined in the `DataBucket`.
    - **Decision**: Implement `initBrainsTask` shared by `newGameTask` and `loadGameTask`.
    - **MVP**: Initialize a Regular-difficulty Brain for each non-"currentPlayer".
    - **Minor Players**: Use "Single Virtual Region" (Option A). Treat minor players as having one region containing all
      their localities to keep logic DRY.
- **PreSettled Mindset**: `src/Actor/Ai/Mindsets/PreSettled.ts` exists but is mostly a skeleton.
    - **MVP Logic**:
        - **LocalCommand.act**: Identify idle units -> Match to priorities (Explore/Settle).
        - **PreSettled.analyzeStrategy**: Aggregate exploration notes from localities. If culture status is `canSettle`
          or `mustSettle`, emit high-importance Settle priorities.
- **Human UI (PohEngine)**: Wiring the "Settle" and "Explore" buttons to the `ActionBus` is required for the player to
  progress.
    - **Unit Actions**:
        - Unit Design: Add `actions(): ActionType[]` (computed from platform & equipment).
        - Unit: Add `get availableActions(): ActionType[]`.
        - **Pattern**: Use `try { action.validateAction(); ... } catch { ... }` to reuse Simulation validators for
          filtering buttons.
    - **Architecture**: Simultaneous (push on demand) model for immediate UI feedback.
- **Memory & Analysis**: AI `Brain` uses a hierarchical memory structure.
    - **Hierarchy**:
        - Strategic Memory (General): Long-term/Global.
        - Region Memory (Captain): Mid-term.
        - Local Memory (Sergeant): Short-term/Tile-specific (e.g., tracking which unit is exploring which tile).
    - **Segmentation**: Grid-based IDs (9x9 Localities, 3x3 Regions using `Math.floor(x / 9)` logic).

## Relations

- **Simulation**: Actors push `IAction` (Intents) to the `ActionBus`. They must generate a unique `transactionId` for
  each action.
- **Common**: Depends on `IAction` and `Player` models.
- **Data**: AI `Brain` subscribes to the `EventBus` to update its internal `Memory`. It must handle events that may have
  attributes masked based on visibility.

## Actor Todo List

- [ ] **CurrentGame.ts**: Implement `initBrainsTask` for creating AI Brains on New/Load game.
- [ ] **AiTypes.ts**: Add `targetId?: string` to `Priority` type.
- [ ] **PreSettled.ts**: Implement `analyzeStrategy` to generate exploration and settling priorities.
- [ ] **LocalCommand.ts**: Implement `act()` to assign movement actions to idle units based on local priorities.
- [ ] **Unit.ts**: Implement `availableActions` using the simulation validation try/catch pattern.
- [ ] **NextAction.vue**: Subscribe to `useCurrentContext` and display buttons for `availableActions`.
