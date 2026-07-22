import type { MetadataRoute } from "next";

// Privacy-by-default: the entire product is disallowed from indexing.
// (Also enforced per-page via the `robots` export and X-Robots-Tag headers.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
