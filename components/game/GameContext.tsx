'use client'

import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { EventInput } from '@/engine/events'
import type { CaseContent } from '@/engine/case-schema'
import type { InvestigationState } from '@/engine/types'
import type { GameStore, GameStoreApi } from '@/state/store'

const GameContext = createContext<GameStoreApi | null>(null)

export const GameProvider = GameContext.Provider

export function useGameApi(): GameStoreApi {
  const api = useContext(GameContext)
  if (!api) throw new Error('useGameApi must be used inside <GameProvider>')
  return api
}

export function useGame<T>(selector: (store: GameStore) => T): T {
  return useStore(useGameApi(), selector)
}

export function useInvestigation<T>(selector: (state: InvestigationState) => T): T {
  return useGame((s) => selector(s.investigation))
}

export function useContent(): CaseContent {
  return useGame((s) => s.content)
}

export function useDispatch(): (input: EventInput) => void {
  return useGame((s) => s.dispatch)
}
