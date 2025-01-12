import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RideShare",
    short_name: "RideShare",
    description: "Connect with friends, share rides, and travel together safely.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#fff",
    icons: [
      {
        src: "/icon_192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "1000x1000",
        type: "image/svg",
      },
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    orientation: "portrait",
    categories: ["travel", "social"],
    screenshots: [
      {
        src: "/wide-pwa.png",
        sizes: "2808x1550",
        type: "image/png",
        form_factor: "wide",
        label: "Wonder Widgets",
      },
      {
        src: "/narrow-pwa.png",
        sizes: "978x1620",
        type: "image/png",
        form_factor: "narrow",
        label: "Wonder Widgets",
      },
    ],
  };
}
