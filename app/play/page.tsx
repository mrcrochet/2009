import { CASE_001 } from '@/content'
import { GameLoader } from '@/components/game/GameLoader'

/** A guest investigation. No account, no prompt, no interstitial. */
export default function PlayPage() {
  return <GameLoader content={CASE_001} mode="new" />
}
