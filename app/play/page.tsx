import { DAY_01 } from '@/content'
import { GameLoader } from '@/components/game/GameLoader'

/** A guest timeline. No account, no prompt, no interstitial. */
export default function PlayPage() {
  return <GameLoader content={DAY_01} mode="new" />
}
