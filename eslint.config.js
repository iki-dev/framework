import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"] },
  { languageOptions: { globals: globals.node } },
  tseslint.configs.recommended,
  {
    files: ["**/*.{ts,mts,cts}"],
    rules: {
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: {
            constructors: "no-public",
            properties: "off",
            parameterProperties: "explicit",
          },
        },
      ],
    },
  },
);
