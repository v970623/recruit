import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        luxuryGray: "#E5E5E5", // 柔和的高级灰
        luxuryBlack: "#222222", // 深灰黑背景
        luxuryWhite: "#F8F8F8", // 柔和白色
        luxuryAccent: "#4A4A4A", // 用于细节的深灰
      },
      backgroundImage: {
        "luxury-pattern": "url('/luxury-pattern.jpg')", // 纹理背景
      },
      fontFamily: {
        luxury: ["'Playfair Display', serif"], // 优雅的标题字体
        sans: ["'Montserrat', sans-serif"], // 清晰的正文字体
      },
      boxShadow: {
        luxury: "0 8px 16px rgba(0, 0, 0, 0.1)", // 柔和的卡片阴影
      },
      borderRadius: {
        luxury: "8px", // 细腻圆角
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class", // 避免全局影响
    }),
  ],
};

export default config;
