/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: { node: true },
  ignorePatterns: ["dist"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/stylistic",
    "plugin:@typescript-eslint/strict",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  rules: {
    curly: ["error", "all"],
    "no-extra-boolean-cast": ["off"],
    "sort-imports": ["error", { ignoreDeclarationSort: true }],

    "import/newline-after-import": ["error"],
    "import/no-anonymous-default-export": ["error"],
    "import/no-cycle": ["error"],
    "import/no-duplicates": ["error"],
    "import/no-extraneous-dependencies": ["error"],
    "import/no-mutable-exports": ["error"],
    "import/no-self-import": ["error"],
    "import/no-useless-path-segments": ["error"],
    "import/order": [
      "error",
      {
        alphabetize: { order: "asc" },
        groups: ["builtin", "external", "internal", "parent", "sibling"],
        "newlines-between": "always",
      },
    ],

    "@typescript-eslint/array-type": ["error", { default: "generic" }],
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/method-signature-style": ["error"],
    "@typescript-eslint/no-unused-vars": ["error"],
    "@typescript-eslint/prefer-enum-initializers": ["error"],
  },
};
