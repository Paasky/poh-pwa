# Rules for Code Agents

This file contains rules you must follow at all times, for all tasks.

## Preparation

Always start by reading the `docs/projectBible.md`. It contains the core rules and commandments of this project that
must be followed at all times by humans and robots alike.

## Planning

When planning a task, always output a no-nonsense, ready for hand-off, todo tasklist:

- Each step must be well described. No fluff, it's for a developer so explain why it must be done and what must be done
  with zero ambiguity.
- Be forceful: don't allow for developer choice or opinions. You choose the correct approach.
- Be ruthless: as the bible states, no code is sacred. the goal is clean industry standard code, not a
  backwards-compatible half-measure. If old code breaks, so be it, it will be fixed later.
- Be precise: check versions, require updates, define public apis & their uses.

## Execution

- Implement the plan as stated.
- Do not deviate from the plan.
- Do not do anything not described in the plan.
- Do not start fixing things not in the plan: note them for later.
- Do not run any tests unless given explicit permission.
- If the plan and reality mismatch: stop immediately and shout and scream that the plan has a problem.
- ALWAYS CHECK IMPORTS OF EVERY FILE YOU EDIT.

## Static Data Guidelines

- Data is stored in `public/data/types` and `public/data/categories`.
- Filenames must match the object key prefix (e.g., `actionType:move` must be in `actionType.json` or
  `actionType/filename.json`).
- Manifest is auto-generated via `pnpm data:analyze`.
- All data is validated against Zod schemas in `src/Data/StaticDataLoader.ts`.