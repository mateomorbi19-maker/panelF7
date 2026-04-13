import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        f7red: "#E63946",
        f7blue: "#1D3557",
        f7dark: "#0F1B2A",
        f7gray: "#F1F3F5",
      },
    },
  },
  plugins: [],
};
export default config;
