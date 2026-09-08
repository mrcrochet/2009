import type { MetadataRoute } from 'next'

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
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
