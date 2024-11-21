/** @type {import('tailwindcss').Config} */
import { iconsPlugin, getIconCollections } from "@egoist/tailwindcss-icons";

export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            animation: {
                slideIn: "slideIn 1.6s forwards",
            },
            keyframes: {
                slideIn: {
                    "0%": { opacity: "0", top: "0px" },
                    "10%": { opacity: "1", top: "10px" },
                    "90%": { opacity: "1", top: "10px" },
                    "100%": { opacity: "0", top: "0px" },
                },
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [
        iconsPlugin({
            // https://icones.js.org/
            collections: getIconCollections(["tabler"]),
        }),
    ],
};
