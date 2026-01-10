#!/usr/bin/env node
/**
 * Smart fixer that runs Prettier and ESLint with auto-fix and then
 * prints a clear summary of what changed and what to do next.
 */

import { spawnSync } from "node:child_process";

function run(cmd, args) {
  const { status } = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (status !== 0) process.exit(status ?? 1);
}

console.log("\n🛠️  Running project auto-fixes (ESLint → Prettier)...\n");

// 1) ESLint (fix) — run first so Prettier can finalize formatting after rule-based changes
run("pnpm", ["lint:fix"]);

// 2) Prettier (write) — ensure formatting matches what precommit:all checks
run("pnpm", ["format"]);

// 3) Show what changed (in working tree)
const gitShow = spawnSync("git", ["diff", "--name-only"], {
  encoding: "utf8",
});

if (gitShow.status === 0) {
  const changed = gitShow.stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (changed.length) {
    console.log("\n📄 Files modified by fixes:");
    for (const f of changed) console.log("  -", f);
    // 4) Verify no Prettier issues remain
    const verify = spawnSync("pnpm", ["format:check"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (verify.status && verify.status !== 0) {
      console.error("\n❌ Some formatting issues remain after auto-fix.");
      console.error(
        "   This usually means ESLint reintroduced changes; try re-running 'pnpm fix'.",
      );
      console.error(
        "   If it persists, run 'pnpm format' manually and check for local line-ending settings.",
      );
      process.exit(verify.status ?? 1);
    }
    console.log(
      `\n✅ Auto-fixes applied and verified.\n\nNext steps:\n  1) Review the changes above.\n  2) Stage them: git add -A\n  3) Re-run checks: pnpm precommit:all\n  4) Commit once all checks pass.\n`,
    );
    process.exit(0);
  } else {
    console.log(
      "\nℹ️  No pending working tree changes after running fixes. Files were either already formatted or changes are already staged.",
    );
    // Still verify formatting to ensure precommit:all won't fail
    const verify = spawnSync("pnpm", ["format:check"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (verify.status && verify.status !== 0) {
      console.error("\n❌ Formatting issues detected even though no new changes were made.");
      console.error(
        "   Try running 'pnpm format' and ensure no files are locked or excluded by ignore settings.",
      );
      process.exit(verify.status ?? 1);
    }
    console.log("\nYou can run: pnpm precommit:all\n");
    process.exit(0);
  }
} else {
  console.log("\n⚠️  Could not list changed files with git. Auto-fixes still ran.");
  console.log("Try: git status\n");
}
