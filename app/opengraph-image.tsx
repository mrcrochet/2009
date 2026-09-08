import { ImageResponse } from 'next/og'

export const alt = '2009 — you wake up in 2009. You remember everything.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The share card is the landing, cropped. Deliberately no font fetch: a build that cannot reach
 * Google Fonts should still produce a card, and the composition — the void, the two-tone
 * headline, the mono kicker — carries the identity without the exact typeface.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: '#0a0c0e',
        backgroundImage:
          'radial-gradient(120% 90% at 50% 8%, #15181c 0%, #0a0c0e 55%, #07090b 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 20,
          letterSpacing: '0.18em',
          color: '#5e666e',
          textTransform: 'uppercase',
        }}
      >
        <span>2009</span>
        <span>An interactive record</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 0.96,
            letterSpacing: '-0.03em',
            color: '#eceef0',
          }}
        >
          <span>YOU WAKE UP IN 2009.</span>
          <span style={{ color: '#6f7880' }}>YOU REMEMBER EVERYTHING.</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 24,
            color: '#8b949c',
          }}
        >
          <span>$437.82 in an account that is not yours.</span>
          <span>30 days.</span>
        </div>
      </div>

      <div style={{ fontSize: 19, letterSpacing: '0.12em', color: '#454c53' }}>
        15 JAN 2009 · 07:32 · PORTLAND, OR
      </div>
    </div>,
    size,
  )
}
