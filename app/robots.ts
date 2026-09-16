import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The game surface, the account and the API are not pages anyone should arrive at cold.
      disallow: ['/play', '/play/', '/account', '/auth/', '/billing/', '/api/'],
    },
    sitemap: `${site}/sitemap.xml`,
  }
}
