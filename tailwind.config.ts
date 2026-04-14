import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        f7red: "#E63946",
        f7blue: "#2F6BD6",
        f7bluedark: "#0B1E45",
        f7black: "#050505",
        f7panel: "#0e0e0e",
        f7panel2: "#171717",
        f7border: "#262626",
      },
    },
  },
  plugins: [],
};
export default config;
