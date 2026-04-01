import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidheshwardrugshouse.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/store",
          "/products",
          "/prescription",
          "/faq",
          "/terms-and-conditions",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/cart",
          "/login",
          "/register",
          "/users",
          "/auth/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
