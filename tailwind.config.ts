import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-kame': '#a5dee4', // 自定義顏色 瓶覗
        'custom-dark-green': '#03312E', // 自定義顏色 dark green
        'custom-lapis':'006696', // 自定義顏色 lapis lazuli
      },

      backgroundImage: {
        'gradient-custom-1': 'linear-gradient(to right, #00B4DB, #0083B0)', //漸變色：瓶覗->藍綠色
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
