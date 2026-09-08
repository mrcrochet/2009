import type { MetadataRoute } from 'next'

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** Only the landing is a page in the ordinary sense. Everything else is the product. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }]
}
