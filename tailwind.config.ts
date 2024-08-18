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
        'custom-reseda-green':'#5c745c', // 自定義顏色 reseda green 橄欖綠
        'custom-lapis':'#006696', // 自定義顏色 lapis lazuli 一種藍綠色
        'custom-yinmn-blue':'#315186', // 自定義顏色 yinmn blue 一種藍色
        'custom-earth-yellow':'#DDA15E', //看起來有點像淡土黃色
        'custom-orange-yellow':'#FFB11B', //銘黃色
        'custom-atomic-tangerine': '#FF9B71', //一種較飽和的粉橘色
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
