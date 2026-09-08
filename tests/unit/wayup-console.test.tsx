import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameProvider } from '@/components/game/GameContext'
import { WayUpOverlay } from '@/components/game/WayUpOverlay'
import { createGameStore, type GameStoreApi } from '@/state/store'
import type { EventInput } from '@/engine/events'
import type { WayUpSnapshot } from '@/lib/wayup/types'
import { content, fresh } from './helpers'

/**
 * The relay console.
 *
 * Everything behind this screen is already proven elsewhere: the reducer meters the signal
 * (`mysteries.test.ts`), the routes refuse hostile addresses (`wayup-security.test.ts`), the
 * snapshot is immutable and replays (`replay.test.ts`). What is only provable here is that the
 * *console* is honest about all of it — that it spends what it says it spends, says what the day
 * authored rather than what the server muttered, and never puts a byte of the real web into the
 * game's own DOM.
 *
 * The relay is unconfigured in this repository and in CI, so the 503 is not an edge case being
 * humoured: it is the screen a player actually gets, and the first test is about that.
 */

const cfg = content.wayup!

const SNAPSHOT: WayUpSnapshot = {
  id: 'wu_0123456789abcdef0123456789abcdef',
  canonicalUrl: 'https://columbia-register.com/archive/173',
  title: 'Aion Group — settlements, filings',
  remoteFetchedAt: '2026-09-08T11:04:22.000Z',
  contentHash: 'a'.repeat(64),
  blocks: [
    { kind: 'heading', level: 2, text: 'Settlements' },
    { kind: 'p', text: 'The incorporation date on the filing is not the one that was indexed.' },
    // What a hostile page would send if the boundary were not doing its job. It has to arrive as
    // characters on the screen and never as elements in the tree.
    {
      kind: 'p',
      text: '<script>alert(1)</script><iframe src="https://elsewhere.example"></iframe>',
    },
    { kind: 'list', items: ['recovery', 'actuarial'] },
    { kind: 'code', text: 'GET /archive/173' },
    { kind: 'quote', text: 'nothing further is on file' },
    { kind: 'rule' },
  ],
  outgoingLinks: [
    {
      label: 'columbia-register.com/archive/174',
      url: 'https://columbia-register.com/archive/174',
    },
  ],
  provider: 'firecrawl',
  byteLength: 4096,
}

const RESULTS = [
  {
    title: 'Aion Group — settlements, filings',
    url: 'https://columbia-register.com/archive/173',
    snippet: 'Settlements. Recovery. Actuarial.',
  },
  {
    title: 'Meridian Savings & Loan — closures',
    url: 'https://meridiansavings.com/closed',
    snippet: 'Branch closures, 2009.',
  },
]

/** A response shaped like the one `fetch` returns, down to the header lookup the 429 path needs. */
function reply(status: number, body: unknown, headers: Readonly<Record<string, string>> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
  } as unknown as Response
}

type Answers = {
  search?: Response | (() => Response)
  fetch?: Response | (() => Response)
}

function stubFetch(answers: Answers) {
  const mock = vi.fn(async (path: string) => {
    const answer = path.includes('/search') ? answers.search : answers.fetch
    if (!answer) throw new Error(`no stubbed answer for ${path}`)
    return typeof answer === 'function' ? answer() : answer
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

/** The console as the terminal leaves it: the process admitted, the screen taken. */
const ATTACHED: EventInput[] = [
  { type: 'WAYUP_UNLOCKED', via: 'terminal' },
  { type: 'WAYUP_TOGGLED', open: true },
]

function mount(seed: readonly EventInput[] = ATTACHED) {
  const api: GameStoreApi = createGameStore({ content, timeline: fresh() })
  for (const input of seed) api.getState().dispatch(input)
  const utils = render(
    <GameProvider value={api}>
      <WayUpOverlay />
    </GameProvider>,
  )
  return { api, ...utils }
}

async function transmit(user: ReturnType<typeof userEvent.setup>, query = 'aion group') {
  await user.type(screen.getByLabelText(cfg.queryLabel), query)
  await user.click(screen.getByRole('button', { name: cfg.submitLabel }))
}

/** Select the whole of one rendered block, the way a player drags across a line. */
function selectContentsOf(node: Node) {
  const range = document.createRange()
  range.selectNodeContents(node)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

const observations = (api: GameStoreApi) =>
  api.getState().timeline.eventLog.filter((e) => e.type === 'WAYUP_SNAPSHOT_OBSERVED')

afterEach(() => {
  vi.unstubAllGlobals()
  window.getSelection()?.removeAllRanges()
})

// ------------------------------------------------------------------ offline

describe('no carrier', () => {
  /**
   * There is no `FIRECRAWL_API_KEY` in development or in CI, so `/api/wayup/search` answers 503
   * and this is the whole feature as most people will meet it. It has to be a screen the machine
   * would print, not a failed request wearing a stack trace.
   */
  it('renders the day’s own words when the relay has no index', async () => {
    const user = userEvent.setup()
    stubFetch({ search: reply(503, { error: 'the relay has no index on this side' }) })
    const { api, container } = mount()

    await transmit(user)

    expect(await screen.findByText(cfg.offlineTitle)).toBeInTheDocument()
    expect(screen.getByText(cfg.offlineBody)).toBeInTheDocument()
    // The server's sentence is written for somebody reading a log. The player never sees it.
    expect(document.body.textContent).not.toContain('the relay has no index on this side')

    // And nothing on this screen could spend the day's signal: there is nothing to open.
    expect(container.querySelectorAll('.hal-wayup__row')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: cfg.pinLabel })).not.toBeInTheDocument()
    expect(api.getState().timeline.wayup.signalSpent).toBe(0)
    expect(screen.getByTestId('wayup-signal')).toHaveTextContent(
      `signal ${cfg.signalBudget} of ${cfg.signalBudget}`,
    )
  })
})

// ----------------------------------------------------------------- refusals

describe('refusals', () => {
  /**
   * The routes answer with a stable refusal code beside a developer-facing message. The code is
   * the part the day has written a line for; the message is the part that would break the voice
   * the moment it reached the screen.
   */
  it('says the authored line for a refusal code, and never the server’s own', async () => {
    const user = userEvent.setup()
    stubFetch({
      search: reply(400, {
        error: 'that host does not resolve (EAI_AGAIN blackbird-hosting.net)',
        refusal: 'unresolvable',
      }),
    })
    mount()

    await transmit(user)

    expect(await screen.findByText(cfg.refusals.unresolvable!)).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('EAI_AGAIN')
  })

  it('falls back to the authored fallback when the code is one nobody wrote a line for', async () => {
    const user = userEvent.setup()
    // A 502 carries no refusal code at all: the far end simply did not answer.
    stubFetch({ search: reply(502, { error: 'the other side did not answer' }) })
    mount()

    await transmit(user)

    expect(await screen.findByText(cfg.fallbackRefusal)).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('the other side did not answer')
  })

  /** 429 carries the one number the console can honestly report: how long the line is shut. */
  it('reports a rate limit in seconds rather than as a failure', async () => {
    const user = userEvent.setup()
    stubFetch({
      search: reply(429, { error: 'the signal needs a moment' }, { 'retry-after': '9' }),
    })
    mount()

    await transmit(user)

    expect(await screen.findByText(cfg.rateLimited.replace('{{seconds}}', '9'))).toBeInTheDocument()
  })
})

// ------------------------------------------------------------------ the cost

describe('the budget', () => {
  it('spends the authored cost once for a page, and nothing to read it again', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch({
      search: reply(200, { query: 'aion group', results: RESULTS, provider: 'firecrawl' }),
      fetch: reply(200, { snapshot: SNAPSHOT, cached: false }),
    })
    const { api } = mount()

    await transmit(user)
    await user.click(await screen.findByRole('button', { name: /settlements, filings/i }))

    // The page is on screen, and the machine reports the capture the way the day wrote it.
    // Waited on the back control rather than the title: a row carries the same title as the page
    // it opens, so the title proves only that the row is still there.
    await screen.findByRole('button', { name: cfg.backLabel })
    expect(screen.getByText(SNAPSHOT.title)).toBeInTheDocument()
    expect(
      screen.getByText(
        `received ${SNAPSHOT.remoteFetchedAt} · ${SNAPSHOT.byteLength} bytes · via firecrawl`,
      ),
    ).toBeInTheDocument()

    expect(api.getState().timeline.wayup.observed).toEqual([SNAPSHOT.id])
    // Asking cost too. The question is charged on the answer, the page on the opening.
    expect(api.getState().timeline.wayup.signalSpent).toBe(cfg.searchCost + cfg.openCost)
    expect(observations(api)).toHaveLength(1)
    expect(observations(api)[0]).toMatchObject({
      snapshotId: SNAPSHOT.id,
      signalCost: cfg.openCost,
    })

    // Back out and open the same address again. The reducer would refuse the second spend, but
    // the log should not carry the second observation either: a save is a record of what
    // happened, and reading a page twice is one capture.
    await user.click(screen.getByRole('button', { name: cfg.backLabel }))
    await user.click(await screen.findByRole('button', { name: /settlements, filings/i }))
    await screen.findByRole('button', { name: cfg.backLabel })

    expect(api.getState().timeline.wayup.signalSpent).toBe(cfg.searchCost + cfg.openCost)
    expect(observations(api)).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  /**
   * The rule from CLAUDE.md §22, and the reason it is a rule: a control that becomes `disabled`
   * under the player's own focus drops them to `<body>` and costs them their place on a screen
   * they were reading. `aria-disabled` says the same thing to a screen reader and keeps the tab
   * stop. The console also has to *say* it is spent — a dimmed button is colour alone.
   */
  it('goes quiet without taking the keyboard with it', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch({ search: reply(200, { query: 'x', results: [], provider: 'f' }) })
    const { api } = mount([
      ...ATTACHED,
      { type: 'WAYUP_SNAPSHOT_OBSERVED', snapshotId: 'wu_spent', signalCost: cfg.signalBudget },
    ])

    const button = screen.getByRole('button', { name: cfg.submitLabel })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()
    expect(screen.getByText(cfg.exhausted)).toBeInTheDocument()

    await user.type(screen.getByLabelText(cfg.queryLabel), 'aion group')
    await user.click(button)
    // The reducer would refuse the spend anyway; the point is that the player is never sent to
    // find that out.
    expect(fetchMock).not.toHaveBeenCalled()
    expect(api.getState().timeline.wayup.signalSpent).toBe(cfg.signalBudget)
  })

  it('closes the returns the moment the day’s signal runs out', async () => {
    const user = userEvent.setup()
    stubFetch({ search: reply(200, { query: 'aion', results: RESULTS, provider: 'firecrawl' }) })
    const { api } = mount()

    await transmit(user)
    const row = await screen.findByRole('button', { name: /settlements, filings/i })
    expect(row).toHaveAttribute('aria-disabled', 'false')
    // The price is on the row before it is paid, not discovered afterwards.
    expect(row).toHaveTextContent(cfg.costTemplate.replace('{{cost}}', String(cfg.openCost)))

    // Spent somewhere else entirely — another window, the last of the day's budget — while these
    // rows are still on screen.
    act(() => {
      api.getState().dispatch({
        type: 'WAYUP_SNAPSHOT_OBSERVED',
        snapshotId: 'wu_elsewhere',
        // Everything the day had left after the question that produced these rows.
        signalCost: cfg.signalBudget - cfg.searchCost,
      })
    })

    await waitFor(() => expect(row).toHaveAttribute('aria-disabled', 'true'))
    expect(row).not.toBeDisabled()
    expect(screen.getByText(cfg.exhausted)).toBeInTheDocument()
  })

  it('says the authored line rather than an empty list', async () => {
    const user = userEvent.setup()
    stubFetch({ search: reply(200, { query: 'nothing', results: [], provider: 'firecrawl' }) })
    mount()

    await transmit(user, 'a name nobody wrote down')
    expect(await screen.findByText(cfg.emptyResults)).toBeInTheDocument()
  })
})

// ------------------------------------------------------------- the boundary

describe('what crosses into the game’s own DOM', () => {
  /**
   * The whole reason the API returns normalised blocks instead of a page. If this test ever
   * fails, the relay has stopped being a relay and become an embedded browser pointed at the
   * live internet, inside an origin that holds the player's save.
   */
  it('renders remote text as text, and nothing else', async () => {
    const user = userEvent.setup()
    stubFetch({
      search: reply(200, { query: 'aion', results: RESULTS, provider: 'firecrawl' }),
      fetch: reply(200, { snapshot: SNAPSHOT, cached: false }),
    })
    const { container } = mount()

    await transmit(user)
    await user.click(await screen.findByRole('button', { name: /settlements, filings/i }))
    await screen.findByRole('button', { name: cfg.backLabel })

    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.innerHTML).not.toContain('<script')
    expect(container.innerHTML).not.toContain('<iframe')
    // The markup arrived, and arrived as characters.
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument()

    // Not one anchor: an address on a 2026 page is a line the player may choose to send back
    // through the relay, never something this browser can be made to follow on its own.
    expect(container.querySelectorAll('a')).toHaveLength(0)
    for (const anchor of container.querySelectorAll('a')) {
      expect(new URL(anchor.getAttribute('href') ?? '', window.location.href).origin).toBe(
        window.location.origin,
      )
    }
    // The address is on the page, as text, under the line the day wrote for it.
    expect(screen.getByText(cfg.linksLabel)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'columbia-register.com/archive/174' }),
    ).toBeInTheDocument()
  })
})

// ------------------------------------------------------------ keeping a line

describe('keeping a line', () => {
  async function openThePage(user: ReturnType<typeof userEvent.setup>) {
    stubFetch({
      search: reply(200, { query: 'aion', results: RESULTS, provider: 'firecrawl' }),
      fetch: reply(200, { snapshot: SNAPSHOT, cached: false }),
    })
    const mounted = mount()
    await transmit(user)
    await user.click(await screen.findByRole('button', { name: /settlements, filings/i }))
    await screen.findByRole('button', { name: cfg.backLabel })
    return mounted
  }

  /**
   * "Select the text and press keep" is a pointer gesture: without caret browsing nobody can
   * make a selection in non-editable content, so the relay's only mechanic was unreachable by
   * keyboard. The document is a list of lines — one tab stop, arrows, Enter — which is a widget
   * the console can back with its whole keyboard contract.
   */
  it('can be worked without a mouse at all', async () => {
    const user = userEvent.setup()
    const { api } = await openThePage(user)

    const doc = screen.getByRole('listbox', { name: cfg.docLabel })
    doc.focus()
    expect(doc).toHaveFocus()

    const options = within(doc).getAllByRole('option')
    expect(options.length).toBeGreaterThan(1)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowDown}')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(doc).toHaveAttribute('aria-activedescendant', options[1]!.id)

    await user.keyboard('{Enter}')
    await waitFor(() => expect(api.getState().timeline.wayup.futureEvidence).toHaveLength(1))
    expect(api.getState().timeline.wayup.futureEvidence[0]!.excerpt).toBe(
      options[1]!.textContent?.trim(),
    )
  })

  it('does not decide which line matters when nobody has chosen one', async () => {
    const user = userEvent.setup()
    const { api } = await openThePage(user)

    // No selection, and the player has never been inside the document.
    await user.click(screen.getByRole('button', { name: cfg.pinLabel }))
    // The hint is in the console's own status line as well as beside the control.
    expect((await screen.findAllByText(cfg.pinHint)).length).toBeGreaterThan(0)
    expect(api.getState().timeline.wayup.futureEvidence).toHaveLength(0)
  })

  it('keeps the selected line, hashed the way the other side hashes', async () => {
    const user = userEvent.setup()
    const { api } = await openThePage(user)

    const line = 'The incorporation date on the filing is not the one that was indexed.'
    selectContentsOf(screen.getByText(line))
    await user.click(screen.getByRole('button', { name: cfg.pinLabel }))

    await waitFor(() => expect(api.getState().timeline.wayup.futureEvidence).toHaveLength(1))
    const kept = api.getState().timeline.wayup.futureEvidence[0]!
    expect(kept.snapshotId).toBe(SNAPSHOT.id)
    expect(kept.excerpt).toBe(line)
    // Hex SHA-256, the shape `lib/wayup/cache.ts` produces on the server side.
    expect(kept.excerptHash).toMatch(/^[0-9a-f]{64}$/)

    // And the control says so, in the day's word for it, rather than by going grey.
    const control = await screen.findByRole('button', { name: cfg.pinnedLabel })
    expect(control).toHaveAttribute('aria-disabled', 'true')
    expect(control).not.toBeDisabled()
  })

  /**
   * The instruction is content, not a component's idea of help text — and pressing the control
   * with nothing marked has to say something, or the mechanic silently does nothing and the
   * player concludes it is broken.
   */
  it('asks for a line rather than keeping the whole page', async () => {
    const user = userEvent.setup()
    const { api } = await openThePage(user)

    window.getSelection()?.removeAllRanges()
    await user.click(screen.getByRole('button', { name: cfg.pinLabel }))

    expect(screen.getByRole('status')).toHaveTextContent(cfg.pinHint)
    expect(api.getState().timeline.wayup.futureEvidence).toHaveLength(0)
  })
})

// --------------------------------------------------------------- the mode

describe('the console as a mode', () => {
  /**
   * The board's contract, copied exactly: focus moves in, Escape leaves, and whatever opened the
   * console gets the focus back — which on the real path is the terminal's command line, and a
   * player who loses it has lost the only place they can type.
   */
  it('takes focus on open and hands it back on Escape', async () => {
    const user = userEvent.setup()
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    const { api } = mount()
    expect(screen.getByLabelText(cfg.queryLabel)).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(api.getState().timeline.ui.wayupOpen).toBe(false)
    await waitFor(() => expect(opener).toHaveFocus())
    opener.remove()
  })

  it('leaves by its own control too', async () => {
    const user = userEvent.setup()
    const { api } = mount()

    await user.click(screen.getByRole('button', { name: cfg.closeLabel }))
    expect(api.getState().timeline.ui.wayupOpen).toBe(false)
  })

  it('is not on the machine until the process has been found', () => {
    const { container } = mount([])
    expect(container).toBeEmptyDOMElement()
  })
})
