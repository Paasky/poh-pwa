# Pages of History PWA

## Installation

- Run `pnpm install`
- Download media from Drive, copy to `public/media`
  - Folder structure:
    - `public/media/audio`
    - `public/media/images`
    - `public/media/quotes`
    - etc
- Run `vite`

## Development

### Pre-commit quality checks

This repo enforces comprehensive quality gates on every commit using Husky pre-commit hooks. On commit, the following will run and the commit will be blocked on any error or warning:

- Prettier format check (no auto-fix) — ensures consistent formatting
- ESLint with TypeScript and Vue rules — warnings are treated as errors
- Type checking via vue-tsc
- Unit tests via Vitest (non-watch, full run)
- Vite development build — build warnings are treated as errors

Manual run:

- `pnpm precommit:all`

Fixing common issues quickly:

- `pnpm fix` — runs Prettier and ESLint auto-fixes across the repo

Notes:

- Hooks are installed automatically on `pnpm install` via the `prepare` script. If hooks are not running, execute `pnpm prepare`.
- To fix lint/format issues automatically, just run: `pnpm fix`.
- Skipping hooks with `git commit -n` is discouraged; CI should reflect the same checks.
- Linting ignores configuration/build scripts and tests by default (e.g., _.config._, vite.config._, tailwind/postcss config files, scripts/**, tests/**, **tests**/\*\*, _.spec._, _.test.\*). These files often intentionally deviate from app code rules.

What runs under the hood (see package.json scripts):

- `format:check` → `prettier -c .`
- `lint` → `eslint . --max-warnings 0`
- `typecheck` → `vue-tsc --noEmit -p tsconfig.json`
- `test` → `vitest run`
- `build:dev` → `vite build --mode development` with `FAIL_ON_WARNINGS=1` to fail on any Rollup/Vite warning

## Deployment

- todo: details about CI commands, config, etc; examples for common platforms
