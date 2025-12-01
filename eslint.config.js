// ESLint Flat config for Vue 3 + TypeScript + Vite
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

export default [
  {
    // Ignore generated output, type decls, tests, and various config/build scripts
    ignores: [
      "dist",
      "node_modules",
      "coverage",
      ".vite",
      "**/*.d.ts",
      // Tests
      "tests",
      "**/__tests__/**",
      "**/*.spec.*",
      "**/*.test.*",
      // Config and build scripts (often different environments or looser rules)
      "*.config.*",
      "**/*.config.*",
      "eslint.config.js",
      "vite.config.*",
      "tailwind.config.*",
      "postcss.config.*",
      "vitest.config.*",
      "jest.config.*",
      "scripts/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Vue 3 recommended flat config
  ...vue.configs["flat/recommended"],
  // Ensure .vue files use the correct parser combo (vue-eslint-parser + TS for <script>)
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
  },
  {
    rules: {
      "no-unused-vars": "off", // handled by TS
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "no-undef": "off",
    },
  },
];
