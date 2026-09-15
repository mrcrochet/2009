import { redirect } from 'next/navigation'
import { CASE_001, DEFAULT_CASE_ID, contentForCase, hasContentForCase } from '@/content'
import { GameLoader } from '@/components/game/GameLoader'
import { getServerEntitlement } from '@/lib/billing/entitlement'
import { getCurrentUser } from '@/lib/supabase/server'
import { loadServerInvestigationCase } from '@/lib/supabase/investigations'

interface Props {
  params: Promise<{ investigationId: string }>
  searchParams: Promise<{ case?: string }>
}

/**
 * Resuming an investigation. Case 001 is always free; anything else is gated **server-side**
 * before a single byte of paid content is sent.
 */
export default async function ResumePage({ params, searchParams }: Props) {
  const { investigationId } = await params
  const { case: requested } = await searchParams

  const user = await getCurrentUser()
  const storedCase = user ? await loadServerInvestigationCase(investigationId, user.id) : null
  const caseId = requested ?? storedCase ?? DEFAULT_CASE_ID

  if (caseId !== DEFAULT_CASE_ID) {
    const entitlement = await getServerEntitlement(user?.id ?? null)
    if (!entitlement.active) {
      redirect(
        `/account?upgrade=1&claim=${encodeURIComponent(investigationId)}&case=${encodeURIComponent(caseId)}`,
      )
    }
    if (!hasContentForCase(caseId)) {
      redirect(`/account?soon=1&case=${encodeURIComponent(caseId)}`)
    }
  }

  const content = hasContentForCase(caseId) ? contentForCase(caseId) : CASE_001
  return <GameLoader content={content} investigationId={investigationId} mode="resume" />
}
