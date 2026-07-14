import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/legal";
import { PUBLIC_INDEXABLE_PATHS } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_INDEXABLE_PATHS.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/pricing" ? 0.9 : 0.5,
  }));
}
