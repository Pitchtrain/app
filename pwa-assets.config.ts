import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    ...minimal2023Preset,
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { background: "#102033" },
    },
  },
  images: ["public/icon.svg"],
});
