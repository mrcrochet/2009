import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/** Only the landing is a page in the ordinary sense. Everything else is the product. */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl()
  return [{ url: site, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }]
}
