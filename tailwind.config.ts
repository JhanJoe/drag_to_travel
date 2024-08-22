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
        'custom-kame': '#a5dee4', // 自定義顏色 瓶覗 rgb(165, 222, 228)
        'custom-atomic-tangerine': '#FF9B71', //一種較飽和的粉橘色 rgb(255, 155, 113)
        'custom-reseda-green':'#5c745c', // 自定義顏色 reseda green 橄欖綠 rgb(82, 116, 87)

        'custom-caribbean-green':'#3c6e71', // 自定義顏色 Caribbean green 橄欖綠 rgb(60, 110, 113)
        'custom-hookers-green': '#496F5D', // 自定義顏色 hooker's green 橄欖綠 rgb(73, 111, 93)
        'custom-lapis':'#006696', // 自定義顏色 lapis lazuli 一種藍綠色 rgb(0, 102, 150)
        'custom-yinmn-blue':'#315186', // 自定義顏色 yinmn blue 一種藍色 rgb(49, 81, 134)
        'custom-dark-green': '#03312E', // 自定義顏色 dark green rgb(3, 49, 46)
        'custom-earth-yellow':'#DDA15E', //看起來有點像淡土黃色 rgb(221, 161, 94)
        'custom-orange-yellow':'#FFB11B', //銘黃色 rgb(255, 177, 27)
                
        'custom-bittersweet': '#F0675E', //粉橘色
        'custom-lemon-chiffon': '#F3F2BD', //淡黃色

        'custom-salmon': '#FF8176', //鮭魚色
        'custom-tiffany-blue': '#81ccbd', //淡綠色
        'custom-hunter-green': '#495f41', //深綠色
        'custom-flax': '#f7f49d', //淡黃色

      },

      backgroundImage: {
        'gradient-custom-1': 'linear-gradient(to right, #00B4DB, #0083B0)', //漸變色：瓶覗->藍綠色
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },

      keyframes: {
        'fade-in-out': {
          '0%, 25%, 100%': { opacity: '0' },
          '12.5%, 37.5%': { opacity: '1' },
        },
      },

      animation: {
        'fade-in-out': 'fade-in-out 28s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
