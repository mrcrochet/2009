import { CasesHome } from '@/components/product/CasesHome'

/**
 * Home — the front door of the product.
 *
 * Cases arrive the way a streaming service releases series: a shelf you choose from, one case at
 * a time. So the root of the site is the shelf, not a poster for a single case, and everything
 * else is reachable from it.
 */
export default function Page() {
  return <CasesHome />
}
