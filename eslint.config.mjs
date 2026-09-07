import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  globalIgnores([".next/**", "node_modules/**", "coverage/**"]),
  nextPlugin.flatConfig.coreWebVitals,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];
