# Migration Plan: modularizing Static Data

## Goal

Replace the monolithic `staticData.json` with a modular loading system that fetches individual files from `public/data`,
validates them, and builds rich back-relations.

## 1. Tooling & Preparation

- [x] Update `scripts/analyzeStaticData.ts` to generate a `manifest.json` in `public/data/manifest.json`.
    - This manifest will list all files in `public/data/types` and `public/data/categories` (including those in
      `locked/` subdirectories).

## 2. Implementation of Loader & Validation

- [x] Create `src/Data/StaticDataLoader.ts`.
    - Implement `getStaticData(): Promise<CompiledStaticData>`.
    - It should first fetch `public/data/manifest.json`.
    - Then concurrently fetch all JSON files listed.
    - Merge results into a single `CompiledStaticData` object.
- [x] Implement Validation using `zod` (install, required for prod).
    - Define schemas for `TypeObject` and `CategoryObject`.
    - Validate data after loading.
    - Ensure key consistency (e.g., `actionType:move` must be in a file starting with `actionType`).
- [x] Generate `public/data/schema.json` from `zod` schemas for IDE support.

## 3. DataBucket Refactoring & Back-Relations

- [ ] Modify `DataBucket.fromRaw` to:
    - Delay `Object.freeze()` until after relations are built.
    - Populate `allows` from `requires`.
    - Populate `upgradesFrom` from `upgradesTo`.
    - Populate `CategoryObject.relatesTo` (all types belonging to this category).
    - Populate `conceptType` objects with:
        - `types`: array of keys of all types belonging to this concept.
        - `categories`: array of keys of all categories belonging to this concept.
    - Deep freeze all objects after population.
- [x] Update `DataBucket.init` to call `getStaticData()` if no data is provided.

## 4. Test & Cleanup

- [ ] Update `tests/boot.test.ts`.
    - **Crucial**: Do NOT mock local HTTP traffic for data loading. The test environment should be able to resolve these
      local fetches naturally to prove "offline mode" capability.
    - Remove MSW mock for `/staticData.json`.
    - Keep 404 mocks for environment and skybox.
- [ ] Verify all data-dependent tests pass.
- [ ] Delete `public/staticData.json`.
- [ ] Update documentation for modders.

## 5. Explicit Todo List (Actionable Steps)

1. **[Types]** Update `CategoryObject` and `TypeObject` interfaces in `src/Common/Objects/TypeObject.ts` to include new
   relation fields.
2. **[Loader]** Create `src/Data/StaticDataLoader.ts` with `zod` schemas and `getStaticData` function.
3. **[DataBucket]** Refactor `src/Data/DataBucket.ts` to use `getStaticData` and build all required relations.
4. **[Tests]** Refactor `tests/boot.test.ts` according to the new "no mock" requirement.
5. **[Cleanup]** Remove `public/staticData.json` and verify everything still works.
