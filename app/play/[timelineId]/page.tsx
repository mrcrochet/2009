import { redirect } from 'next/navigation'
import { DAY_01, advanceEventFor, contentForDay, hasContentForDay } from '@/content'
import { GameLoader } from '@/components/game/GameLoader'
import { getServerEntitlement } from '@/lib/billing/entitlement'
import { getCurrentUser } from '@/lib/supabase/server'
import { loadServerTimelineDay } from '@/lib/supabase/timelines'

interface Props {
  params: Promise<{ timelineId: string }>
  searchParams: Promise<{ day?: string }>
}

/**
 * Resuming a timeline. Day 01 is always free; anything past it is gated **server-side** before a
 * single byte of paid content is sent.
 */
export default async function ResumePage({ params, searchParams }: Props) {
  const { timelineId } = await params
  const { day } = await searchParams

  const user = await getCurrentUser()
  const storedDay = user ? await loadServerTimelineDay(timelineId, user.id) : null
  const requestedDay = Number(day ?? storedDay ?? 1) || 1

  if (requestedDay > 1) {
    const entitlement = await getServerEntitlement(user?.id ?? null)
    if (!entitlement.active) {
      redirect(`/account?upgrade=1&claim=${encodeURIComponent(timelineId)}&day=${requestedDay}`)
    }
    if (!hasContentForDay(requestedDay)) {
      redirect(`/account?soon=1&day=${requestedDay}`)
    }
  }

  const content = hasContentForDay(requestedDay) ? contentForDay(requestedDay) : DAY_01
  // Computed on the server so a replay never has to reach for another day's content mid-log.
  const advanceEvent = requestedDay > 1 ? advanceEventFor(requestedDay) : undefined
  return (
    <GameLoader
      content={content}
      timelineId={timelineId}
      mode="resume"
      advanceEvent={advanceEvent}
    />
  )
}
