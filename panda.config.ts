import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Enable css reset to normalize browser styles
  preflight: true,

  // Where Panda should look for usage
  include: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
  ],

  // Additional directories to ignore
  exclude: [],

  // Project-level theme customization lives here
  theme: {
    extend: {},
  },
  themes: {},
  // 약어 속성을 허용할지 여부
  shorthands: false,

  // Emit generated artifacts alongside source code
  outdir: "src/styled-system",
});
