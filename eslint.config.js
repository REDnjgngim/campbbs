import globals from "globals";
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tailwindCss from "eslint-plugin-tailwindcss";
import prettier from "eslint-config-prettier";

export default [
    js.configs.recommended, // eslint:recommended を適用する
    ...tailwindCss.configs["flat/recommended"],
    prettier,
    {
        // ルールの対象
        files: ["**/*.jsx", "**/*.js"],
        languageOptions: {
            // env オプションは無くなり、代わりに globals を使用
            globals: {
                ...globals.browser,
            },
            // eslintrc の parserOptions と同じ
            parserOptions: {
                ecmaVersion: "latest",
            },
        },
        plugins: {
            react,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            "tailwind-css": tailwindCss,
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...reactRefresh.configs,
            "react/prop-types": "off",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
];
