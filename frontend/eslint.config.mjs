import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginJest from "eslint-plugin-jest";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Global ignores
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  // Configuration files (Node.js environment)
  {
    files: ["*.config.js", "*.config.mjs", "*.config.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  // Test files (Jest environment with JSX support)
  {
    files: [
      "**/__tests__/**",
      "**/*.test.{js,jsx}",
      "**/*.spec.{js,jsx}",
      "src/test-setup.js",
    ],
    plugins: {
      react: pluginReact,
      jest: pluginJest,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node, // Include Node.js globals for test setup
      },
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
      // Allow tests without assertions for debugging/development
      "jest/expect-expect": "warn",
      // Allow conditional expects for certain test scenarios
      "jest/no-conditional-expect": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // React application files (Browser environment)
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    ignores: [
      "**/__tests__/**",
      "**/*.test.{js,jsx}",
      "**/*.spec.{js,jsx}",
      "*.config.js",
      "*.config.mjs",
      "*.config.cjs",
    ],
    plugins: { js, react: pluginReact },
    extends: [js.configs.recommended, pluginReact.configs.flat.recommended],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);
