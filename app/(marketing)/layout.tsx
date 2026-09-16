import type { ReactNode } from 'react'
import '@/styles/product.css'

/**
 * The product's shell, and the first thing anybody sees.
 *
 * It stops at the workstation door: `/play` loads NOVA's stylesheet and none of this, because a
 * SaaS chrome wrapped around an investigation is the one shape this product is not allowed to
 * take.
 */
export default function ProductLayout({ children }: { children: ReactNode }) {
  return <div className="unlisted">{children}</div>
}
