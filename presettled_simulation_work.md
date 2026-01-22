# Pre-Settled Stage: Simulation Work

## Current Findings

- **Functional Logic Rule**: To ensure atomicity and facilitate future multiplayer sync, all simulation actions and
  turn-start logic must be **functional**: `(State, Action) => PohMutation[]`.
- **`UnitSettle.ts`**: Currently only updates the unit's action status. It *must* return mutations to create a `City`,
  update the `Player`'s culture status, and remove the `Unit`.
- **`CultureProgressHeritage.ts`**: This file is empty. It will handle the immediate heritage point calculations
  triggered by tile discovery.
- **`Validator.ts`**: Contains a syntax error at line 29 (`canStartAction`) that prevents compilation.
- **`GameStartTurn.ts`**: Has broken imports for `PlayerAutomation` and `CityStartTurn`.

## MVP Todo List

### 1. `UnitSettle.ts` Implementation

- [ ] **Validator**: Implement a check to ensure no two cities are within a 4-hex radius.
    - *Logic*: Iterate over all cities and use `getDistance(size, unit.tile, city.tile, "hex")`.
- [ ] **HandleAction**: Return an array of mutations:
    - `createCity`: Use `MutationFactory.createCity` at `unit.tile`.
    - `updatePlayer`: Set `culture.status` to `settled`.
    - `deleteUnit`: Remove the settler unit.

### 2. Discovery & Heritage Pipeline

- [ ] **Trigger**: `UnitMove.ts` identifies newly discovered `knownTileKeys`.
- [ ] **Immediate Processing**: For each new tile, calls `player.culture.onTileDiscovered(tile)`.
- [ ] **Data Architecture**: Discovery logic lives in the **Simulation** domain. It generates `PohMutation[]` for
  culture point updates.

### 3. Culture Logic Upgrades

- [ ] **Asymmetric Gameplay Rules**: Update `Culture.selectHeritage` status shifts:
    - **Tier 2 Heritage**: Immediate `mustSettle`.
    - **4 Heritages**: `mustSettle`.
    - **3 Heritages**: `canSettle`.
- [ ] **Legacy Migration**: Refine `onTileDiscovered` to properly iterate through potentially earnable heritages using
  the `TypeObject.allows` property.

### 4. Simulation Backbone Cleanup

- [ ] **`Validator.ts`**: Fix syntax error in `canStartAction`.
- [ ] **`GameStartTurn.ts`**: Update imports to point to `PlayerStartTurn` and the new `CityStartTurn` location.
- [ ] **Atomic Refactor**: Ensure `GameStartTurn`, `PlayerStartTurn`, and `CityStartTurn` return `PohMutation[]` instead
  of calling `dataStore.set()` internally.

## Relations

- **Actor**: Simulation validates `PohAction` intents and returns consequences.
- **Data**: Returns `PohMutation[]` to the central loop to be applied to `DataStore`.
- **Common**: Heavily uses models and `PohMutation` types. Reuses `getDistance` from `mapTools.ts`.
