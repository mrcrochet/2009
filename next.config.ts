import type { NextConfig } from 'next'
import { STATIC_SECURITY_HEADERS } from './lib/security/headers'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['zustand'],
  },
  async headers() {
    return [
      {
        // The Content-Security-Policy is set per request in middleware, because it carries a
        // nonce. Everything that does not vary is served from here.
        source: '/:path*',
        headers: [...STATIC_SECURITY_HEADERS],
      },
    ]
  },
}

export default nextConfig
