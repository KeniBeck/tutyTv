import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["dist/**", "src/web/**", "src/webos/**", "src/tools/**", "capturas/**", "*.ipk", "src/ui/legacy/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,js}", "scripts/**/*.{ts,mjs}", "vite.*.config.ts", "vitest.config.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_"
        }
      ],
      "no-duplicate-imports": "error",
      "import/no-cycle": "warn"
    }
  }
];
