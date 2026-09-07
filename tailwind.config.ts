import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#16231b", grass: "#2f8b57", cream: "#f7f6ef" },
      boxShadow: { card: "0 10px 30px rgb(22 35 27 / 8%)" },
    },
  },
  plugins: [],
};

export default config;
