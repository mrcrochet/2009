import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The engine must stay portable. If this test fails, something has coupled the game rules to a
 * framework, a network client or a platform SDK — and Days 02–30 just became a rewrite.
 */
const FORBIDDEN = [
  /^react/,
  /^next(\/|$)/,
  /^@supabase/,
  /^stripe$/,
  /^dexie$/,
  /^posthog/,
  /^@sentry/,
  /^@\/(app|components|lib|state)\//,
]

const ALLOWED_NODE_FREE = /^(node:|fs|path|crypto)$/

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : []
  })
}

function importsOf(source: string): string[] {
  const specifiers: string[] = []
  const re = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = re.exec(source))) if (match[1]) specifiers.push(match[1])
  const dynamic = /import\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = dynamic.exec(source))) if (match[1]) specifiers.push(match[1])
  return specifiers
}

describe('engine purity', () => {
  const files = [...walk('engine'), ...walk('content')]

  it('finds the engine and content modules', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it.each(files)('%s imports nothing from a framework or platform', (file) => {
    const source = readFileSync(file, 'utf8')
    for (const specifier of importsOf(source)) {
      expect(ALLOWED_NODE_FREE.test(specifier), `${file} imports node builtin ${specifier}`).toBe(
        false,
      )
      for (const pattern of FORBIDDEN) {
        expect(pattern.test(specifier), `${file} imports ${specifier}`).toBe(false)
      }
    }
  })

  it('only ever reaches sideways into engine/ or content/', () => {
    for (const file of files) {
      for (const specifier of importsOf(readFileSync(file, 'utf8'))) {
        if (!specifier.startsWith('@/')) continue
        expect(
          specifier.startsWith('@/engine/') || specifier.startsWith('@/content'),
          `${file} imports ${specifier}`,
        ).toBe(true)
      }
    }
  })
})
