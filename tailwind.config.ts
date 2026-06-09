import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#05071a",
          900: "#0a0e2a",
          800: "#101640",
          700: "#1a2156",
          600: "#272f6e",
        },
        neon: {
          cyan: "#22e0ff",
          pink: "#ff2bd1",
          lime: "#c6ff3a",
          violet: "#9b6bff",
          gold: "#ffd23a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(34,224,255,0.45)",
        "glow-pink": "0 0 20px rgba(255,43,209,0.45)",
        "glow-lime": "0 0 20px rgba(198,255,58,0.45)",
        "glow-gold": "0 0 24px rgba(255,210,58,0.5)",
      },
      keyframes: {
        "pulse-glow": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "spin-wheel": {
          to: { transform: "rotate(var(--spin-to))" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "pop": "pop 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
