import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/legal";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ege-russkiy", "/pricing", "/privacy", "/offer", "/requisites"],
        disallow: [
          "/dashboard",
          "/settings",
          "/tests",
          "/tasks",
          "/texts",
          "/results",
          "/hard-words",
          "/notifications",
          "/search",
          "/student-settings",
          "/pause",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/admin",
          "/api/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL,
  };
}
