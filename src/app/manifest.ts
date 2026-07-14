import type { MetadataRoute } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/branding";
import { SITE_URL } from "@/lib/legal";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — ЕГЭ по русскому`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#14b8a6",
    lang: "ru",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "120x120",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    id: SITE_URL,
  };
}
