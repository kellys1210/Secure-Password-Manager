import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    ignores: ["dist/**", "node_modules/**"],
    plugins: { js, react: pluginReact },
    extends: [js.configs.recommended, pluginReact.configs.flat.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        process: "readonly",
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.config.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/__tests__/**", "**/*.test.{js,jsx}", "**/test-setup.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.browser,
        global: "readonly",
      },
    },
  },
  {
    files: ["**/crypto.manual.test.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        encryptPassword: "readonly",
        decryptPassword: "readonly",
        encryptPasswordBatch: "readonly",
        decryptPasswordBatch: "readonly",
      },
    },
  },
  {
    files: ["**/verify-crypto.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        Buffer: "readonly",
        process: "readonly",
      },
    },
  },
]);
