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
      // Prefer Prettier for formatting — disable formatting-style rules that clash
      // Core formatting rules
      indent: "off",
      quotes: "off",
      semi: "off",
      "comma-dangle": "off",
      "space-before-function-paren": "off",

      // Vue formatting rules that often conflict with Prettier
      "vue/html-indent": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/multiline-html-element-content-newline": "off",
      "vue/html-self-closing": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/html-closing-bracket-spacing": "off",
      "vue/attributes-order": "off",
      "vue/attribute-hyphenation": "off",

      // Pragmatic Vue defaults for this project
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off",

      // TS/JS hygiene
      "no-unused-vars": "off", // handled by TS
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "off",
      "no-console": "warn",
      "no-debugger": "warn",
    },
  },
];
