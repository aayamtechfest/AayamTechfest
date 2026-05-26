import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host") || "aayam.tech";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.");
  const protocol = isLocal ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/admin/*", "/register/", "/register/*"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
