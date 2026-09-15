'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '@/lib/errors'

interface Props {
  readonly children: ReactNode
  readonly onReset?: () => void
}

interface State {
  readonly error: Error | null
}

/** A crash inside NOVA must not look like a browser error page. */
export class GameErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, { scope: 'game.shell', componentStack: info.componentStack })
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children
    return (
      <div className="nova-boot" role="alert">
        <div className="nova-boot__line">NOVA 3.2 — unexpected fault</div>
        <div className="nova-boot__line">&nbsp;</div>
        <div className="nova-boot__line">The session stopped. Your timeline is saved locally.</div>
        <div className="nova-boot__line">&nbsp;</div>
        <button
          type="button"
          className="nova-boot__btn"
          onClick={() => {
            this.setState({ error: null })
            this.props.onReset?.()
          }}
        >
          Restore session
        </button>
      </div>
    )
  }
}
