# Pre-Settled Stage: Data Work

## Current Findings

- **Atomic Mutation Rule**: Mutations only happen inside the `DataStore`. To maintain a predictable state, all actions
  and automated turn logic must return `PohMutation[]` to a central loop for a single `dataStore.set()` call.
- **Heritage Points**: Cateogry-specific points are stored exclusively in the `Culture` model as a
  `Record<CatKey, number>`.
- **Information Masking (Attribute-Level Visibility)**:
    - **Contract**: `GameObject.attrsConf` supports a `visibility` flag.
    - **Implementation**: Attributes without a flag are `public` by default.
    - **Scrubbing**: `DataStore.eventFromMutation` clones the payload and strips attributes marked as `owner-only` (or
      sensitive) if the recipient is not the owner.
- **Multiplayer Future-Proofing**:
    - **Action Identification**: Add `transactionId: string` to `PohAction`. Every UI interaction or AI decision
      generates this using `crypto.randomUUID()`.
    - **Turn Versioning**: `PohAction.turn` must be validated during simulation to prevent stale actions.

## Data Todo List

### 1. Model & Serialization

- [ ] **`Culture.ts`**: Add `visibility: 'owner'` to `heritageCategoryPoints` in `attrsConf`.
- [ ] **`GameObject.ts`**: Update `GameObjAttr` to include the `visibility` flag.

### 2. DataStore Enhancements

- [ ] **Event Scrubbing**: Implement the attribute-level scrubber in `eventFromMutation`.
- [ ] **Multiplayer Groundwork**:
    - Add `TODO: Implement Authoritative Reconciliation - Check transactionId against local optimistic mutations.`
    - Add `TODO: Implement State Hash Checks - Compare WorldState hashes to detect desync.`
    - Add `TODO: Implement Authoritative Rollbacks - Use the backup buffer to revert failed optimistic actions.`

### 3. Simulation Loop Refactor (Data Domain integration)

- [ ] Refactor `GameStartTurn.ts` to aggregate all mutations from players and cities, then call `dataStore.set()` once
  at the end of the turn cycle.

## Relations

- **Actor**: Consumes filtered events. Provides `transactionId` in actions.
- **Simulation**: Provides `PohMutation[]` for storage and broadcasting.
- **Common**: Holds the models and `visibility` flag definitions.
