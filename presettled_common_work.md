# Pre-Settled Stage: Common Work

## Current Findings
- **Models**: The core models (`Player`, `Unit`, `City`, `Tile`) are well-defined in `src/Common/Models/`.
- **Interfaces**: `IAction`, `IEvent`, and `IMutation` provide the contracts between domains.
- **Action/Event Bus**: Singleton buses facilitate communication. `ActionBus` for intents (Actor -> Simulation) and `EventBus` for results (Data -> Actor).
- **Data Types**: `actionType:explore`, `actionType:settle`, and `yieldType:heritagePoint` are already defined in the JSON data and types.

## Domain Interactions: "The Loop"
1. **Actor** (UI/AI): Analyzes state -> Produces `IAction` (with `transactionId`).
2. **Simulation**: Functional logic `(State, Action) => IMutation[]`. Validates actions and calculates consequences.
3. **Data**: `DataStore` applies `IMutation[]` -> Scans for sensitive data -> Publishes filtered `IEvent[]`.
4. **Actor**: Subscribes to `EventBus` -> Updates memory/UI.

## Common Glue Tasks

### 1. IAction Enhancement
- [ ] Add `transactionId: string` to `IAction`. Use `crypto.randomUUID()`.
- [ ] Add `timestamp: number` to `IAction`.
- [ ] Ensure `ActionType` union in `IAction.ts` is 1:1 with `public/data/types/locked/actionType.json`.

### 2. Model Performance & Logic
- [ ] **Visibility Getters**: Update `Player.visibleTileKeys` and `Unit.visibleTileKeys` to use the `this.computed()` decorator.
- [ ] **Culture Status**: Ensure `Culture` model supports the transition states: `unsettled` -> `canSettle` -> `mustSettle` -> `settled`.

### 3. Attribute-Level Visibility (Common Contract)
- [ ] **GameObject Update**: Add `visibility?: 'owner' | 'known' | 'public'` to `GameObjAttr` in `_GameModel.ts`.
- [ ] **Defaults**: Attributes without a visibility flag are `public` by default.
- [ ] **Sensitive Data**: Mark `heritageCategoryPoints` in `Culture.ts` as `visibility: 'owner'`.

### 4. Shared Helpers
- [ ] **Spatial Logic**: Ensure `getDistance` in `mapTools.ts` is used for both AI decision making (finding settle sites) and Simulation validation (4-hex distance rule).

## Relations
- **Data**: Uses Common models for storage and serialization; respects visibility flags for event filtering.
- **Actor**: Produces Common `IAction` and consumes Common `IEvent`.
- **Simulation**: Functional processor of Common interfaces.
