/**
 * Thin error adapter. Sentry-compatible in shape; a console reporter when no DSN is configured,
 * so local development never needs a third-party account.
 */

export interface ErrorContext {
  readonly scope: string
  readonly timelineId?: string
  readonly [key: string]: unknown
}

type Reporter = (error: unknown, context: ErrorContext) => void

let reporter: Reporter = (error, context) => {
  if (process.env.NODE_ENV === 'test') return
  console.error(`[2009:${context.scope}]`, error, context)
}

export function setErrorReporter(next: Reporter): void {
  reporter = next
}

export function reportError(error: unknown, context: ErrorContext): void {
  try {
    reporter(error, context)
  } catch {
    /* never let reporting throw into gameplay */
  }
}

export function isErrorReportingConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
}
