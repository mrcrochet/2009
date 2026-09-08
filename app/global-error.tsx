'use client'

import { useEffect } from 'react'
import { reportError } from '@/lib/errors'

/**
 * The last resort: the root layout itself failed, so there is no font, no token stylesheet and
 * no shared chrome to rely on. Everything here is inline for that reason.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    reportError(error, { scope: 'global', digest: error.digest })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07090b',
          color: '#eceef0',
          fontFamily: 'system-ui, sans-serif',
          padding: 40,
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <h1
            style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 14px' }}
          >
            Something broke on our side.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#8b949c', margin: '0 0 20px' }}>
            Your timeline is saved in this browser and was not affected.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              border: '1px solid #d8dcdf',
              background: '#eceef0',
              color: '#0a0c0e',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.1em',
              padding: '13px 24px',
              textDecoration: 'none',
            }}
          >
            BACK TO THE START
          </a>
        </div>
      </body>
    </html>
  )
}
