#!/usr/bin/env node
/**
 * Runs the full pre-commit quality gate in a controlled, cross-platform way.
 * Steps:
 * 1) Prettier format check
 * 2) ESLint (warnings treated as errors via script)
 * 3) TypeScript type-check
 * 4) Vitest unit tests (non-watch)
 * 5) Vite development build with warnings treated as errors
 *
 * On any failure, exits immediately with the same exit code and prints
 * a friendly hint to run `pnpm fix` to auto-apply formatting and lint fixes.
 */

import { spawnSync } from "node:child_process";

const steps = [
  { name: "Prettier format check", cmd: ["pnpm", "format:check"] },
  { name: "ESLint", cmd: ["pnpm", "lint"] },
  { name: "TypeScript typecheck", cmd: ["pnpm", "typecheck"] },
  { name: "Unit tests", cmd: ["pnpm", "test"] },
  { name: "Vite dev build (fail on warnings)", cmd: ["pnpm", "build:dev"] },
];

for (const step of steps) {
  console.log(`\n▶ ${step.name}...`);
  const { status } = spawnSync(step.cmd[0], step.cmd.slice(1), {
    stdio: "inherit",
    shell: process.platform === "win32", // allow running pnpm on Windows
  });

  if (status !== 0) {
    console.error("\n❌ Pre-commit check failed at:", step.name);
    console.error(
      "   Quick fix: run 'pnpm fix' to auto-apply Prettier + ESLint fixes where possible.",
    );
    console.error(
      "   Then re-run: 'pnpm precommit:all' to verify all checks pass.\n",
    );
    process.exit(status ?? 1);
  }
}

console.log("\n✅ All pre-commit checks passed.");
