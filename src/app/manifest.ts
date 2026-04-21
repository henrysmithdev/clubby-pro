import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clubby — Junior Golf Club Fitting",
    short_name: "Clubby",
    description: "Find the perfect golf clubs for your junior golfer.",
    start_url: "/",
    display: "standalone",
    background_color: "#006747",
    theme_color: "#006747",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
