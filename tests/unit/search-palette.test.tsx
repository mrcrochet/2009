import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { buildWorldIndex, type SearchHit } from '@/engine/world'
import { WorldSchema } from '@/engine/world/schema'
import { WorldProvider } from '@/components/game/WorldContext'
import { SearchPalette } from '@/components/game/SearchPalette'
import { DirectoryApp } from '@/components/game/apps/DirectoryApp'

/**
 * A world small enough to reason about and shaped like the real one: one fact carried by several
 * artifacts on different surfaces, one relation of each confidence, and one entity the player has
 * not met at all.
 */
const world = WorldSchema.parse({
  entities: [
    {
      id: 'marc',
      type: 'person',
      canonicalName: 'Marc Trudeau',
      aliases: ['saabman81'],
      metadata: { 'Last known address': '44 rue Beaubien' },
    },
    { id: 'aion', type: 'organization', canonicalName: 'Aion Group', aliases: [] },
    { id: 'lena', type: 'person', canonicalName: 'Lena Marchetti', aliases: [] },
    // Never mentioned by any artifact the player holds. Its name must not leak.
    { id: 'ghost', type: 'person', canonicalName: 'Marc Delacroix', aliases: [] },
    { id: 'saab', type: 'vehicle', canonicalName: 'Black Saab 9-3', aliases: [] },
  ],
  artifacts: [
    {
      id: 'mail-1',
      type: 'email',
      date: '2009-03-02',
      title: 'Re: the car',
      body: 'Marc still has the Saab.',
      source: 'inbox',
      surface: 'mail',
      mentions: ['marc', 'saab'],
      factId: 'fact-saab',
    },
    {
      id: 'photo-1',
      type: 'photo',
      date: '2009-03-04',
      title: 'Driveway, March',
      body: 'A black Saab, plate partly readable.',
      source: 'Pictures',
      surface: 'files',
      mentions: ['marc', 'saab'],
      factId: 'fact-saab',
    },
    {
      id: 'bank-1',
      type: 'transaction',
      date: '2009-03-06',
      title: 'SAAB SERVICE MTL',
      body: 'Marc paid for a service.',
      source: 'Chequing',
      surface: 'bank',
      mentions: ['marc'],
      factId: 'fact-saab',
      amountCents: -18400,
    },
    {
      id: 'web-1',
      type: 'forumPost',
      date: '2009-03-09',
      title: 'saabman81 posted',
      body: 'Marc, under a handle.',
      source: 'quebecauto.forum',
      surface: 'web',
      mentions: ['marc'],
      factId: 'fact-saab',
    },
    {
      id: 'mail-2',
      type: 'email',
      date: '2009-03-11',
      title: 'Marc — payroll',
      body: 'From Aion Group.',
      source: 'inbox',
      surface: 'mail',
      mentions: ['marc', 'aion'],
    },
    {
      id: 'gossip',
      type: 'forumPost',
      date: '2009-03-12',
      title: 'saw them at the garage',
      body: 'Somebody was with him. Nobody says who.',
      source: 'quebecauto.forum',
      surface: 'web',
      mentions: ['marc'],
    },
  ],
  relations: [
    { from: 'marc', relation: 'employedBy', to: 'aion', confidence: 'asserted' },
    { from: 'marc', relation: 'owns', to: 'saab', confidence: 'inferred' },
    // Named in nothing. `sources` is how an author says where a rumour was actually voiced.
    { from: 'marc', relation: 'knows', to: 'lena', confidence: 'rumoured', sources: ['gossip'] },
  ],
  facts: [
    { id: 'fact-saab', statement: 'Marc owns a black Saab', about: ['marc'], register: 'ordinary' },
  ],
})

const index = buildWorldIndex(world)

/** Two of the four traces of the Saab. Enough to act on, not enough to be the whole world. */
const found = new Set(['mail-1', 'photo-1'])

function mount(node: ReactNode, discovered: ReadonlySet<string> = found) {
  return render(<WorldProvider value={{ index, discovered }}>{node}</WorldProvider>)
}

const noop = () => {}

describe('search palette', () => {
  it('shows a count per surface before anything is opened', async () => {
    const user = userEvent.setup()
    mount(<SearchPalette open onClose={noop} onOpenHit={noop} />)

    await user.type(screen.getByLabelText('Find:'), 'marc')

    const filters = screen.getByRole('group', { name: 'Filter by source' })
    // Three: two men named Marc, and Lena Marchetti, whose surname contains the query. Substring
    // noise like that is what a real search has, and the count is honest about it.
    expect(within(filters).getByRole('button', { name: /People/ })).toHaveTextContent('3')
    expect(within(filters).getByRole('button', { name: /Mail/ })).toHaveTextContent('2')
    expect(within(filters).getByRole('button', { name: /Files/ })).toHaveTextContent('1')
    expect(within(filters).getByRole('button', { name: /Bank/ })).toHaveTextContent('1')
    expect(within(filters).getByRole('button', { name: /Web/ })).toHaveTextContent('1')
  })

  it('filters to one surface without shrinking the other counts', async () => {
    const user = userEvent.setup()
    mount(<SearchPalette open onClose={noop} onOpenHit={noop} />)

    await user.type(screen.getByLabelText('Find:'), 'marc')
    await user.click(screen.getByRole('button', { name: /Mail/ }))

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options.map((o) => o.textContent)).toEqual([
      expect.stringContaining('Marc — payroll'),
      expect.stringContaining('Re: the car'),
    ])

    // The point of the column: while reading the mail you can still see there is a bank line.
    const filters = screen.getByRole('group', { name: 'Filter by source' })
    expect(within(filters).getByRole('button', { name: /Bank/ })).toHaveTextContent('1')
  })

  it('restricts to what the player has found, and does not leak an unmet name', async () => {
    const user = userEvent.setup()
    mount(<SearchPalette open onClose={noop} onOpenHit={noop} />)

    await user.type(screen.getByLabelText('Find:'), 'marc')
    expect(screen.getByText('Marc Delacroix')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Only what I have found'))

    const titles = screen.getAllByRole('option').map((o) => o.textContent ?? '')
    expect(titles.some((t) => t.includes('Marc Trudeau'))).toBe(true)
    // Never met, never mentioned: an entity always matches by name, so this is the leak to guard.
    expect(screen.queryByText('Marc Delacroix')).not.toBeInTheDocument()
    expect(titles.some((t) => t.includes('SAAB SERVICE MTL'))).toBe(false)
  })

  it('reaches a person through an alias', async () => {
    const user = userEvent.setup()
    mount(<SearchPalette open onClose={noop} onOpenHit={noop} />)

    await user.type(screen.getByLabelText('Find:'), 'saabman81')
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Marc Trudeau')
  })

  it('moves with the arrows and opens with Enter, focus staying in the field', async () => {
    const user = userEvent.setup()
    const onOpenHit = vi.fn<(hit: SearchHit) => void>()
    const onClose = vi.fn()
    mount(<SearchPalette open onClose={onClose} onOpenHit={onOpenHit} />)

    const input = screen.getByLabelText('Find:')
    await user.type(input, 'marc')

    // Both Marcs score the same, so they are ordered by name and Delacroix leads.
    const first = screen.getAllByRole('option')[0]
    expect(first).toHaveTextContent('Marc Delacroix')
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', first?.id)

    await user.keyboard('{ArrowDown}')
    const second = screen.getAllByRole('option')[1]
    expect(second).toHaveAttribute('aria-selected', 'true')
    expect(first).toHaveAttribute('aria-selected', 'false')
    expect(input).toHaveAttribute('aria-activedescendant', second?.id)
    // The combobox contract: arrows move the selection, typing still goes to the field.
    expect(input).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowDown}{Enter}')
    expect(onOpenHit).toHaveBeenCalledTimes(1)
    expect(onOpenHit.mock.calls[0]?.[0]).toMatchObject({ kind: 'entity', id: 'marc' })
    expect(onClose).toHaveBeenCalled()
  })

  it('wraps at the ends and jumps with Home and End', async () => {
    const user = userEvent.setup()
    mount(<SearchPalette open onClose={noop} onOpenHit={noop} />)

    await user.type(screen.getByLabelText('Find:'), 'marc')
    const count = screen.getAllByRole('option').length

    await user.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('option')[count - 1]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{End}')
    expect(screen.getAllByRole('option')[count - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('closes on Escape and on the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    mount(<SearchPalette open onClose={onClose} onOpenHit={noop} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Close search' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('traps focus inside the panel and returns it to the opener on close', async () => {
    const user = userEvent.setup()
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    const { rerender } = mount(<SearchPalette open onClose={noop} onOpenHit={noop} />)

    const dialog = screen.getByRole('dialog', { name: 'Search HALCYON' })
    for (let i = 0; i < 8; i += 1) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }

    rerender(
      <WorldProvider value={{ index, discovered: found }}>
        <SearchPalette open={false} onClose={noop} onOpenHit={noop} />
      </WorldProvider>,
    )
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('says nothing rather than nothing-found before the query is a query', () => {
    mount(<SearchPalette open onClose={noop} onOpenHit={noop} />)
    expect(screen.getByRole('status')).toHaveTextContent(/at least two characters/)
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('renders nothing at all when closed', () => {
    const { container } = mount(<SearchPalette open={false} onClose={noop} onOpenHit={noop} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('directory', () => {
  async function openMarc() {
    const user = userEvent.setup()
    mount(<DirectoryApp />)
    await user.click(screen.getByRole('option', { name: 'Marc Trudeau' }))
    return user
  }

  it('lists what the player has run into, grouped and sorted', () => {
    mount(<DirectoryApp />, new Set(['mail-1', 'photo-1', 'mail-2']))
    const list = screen.getByRole('listbox', { name: 'Directory' })
    expect(within(list).getByText('PEOPLE')).toBeInTheDocument()
    expect(within(list).getByText('ORGANIZATIONS')).toBeInTheDocument()
    // Grouped, then sorted inside the group, so a name is in the same place every time.
    expect(
      within(list)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Marc Trudeau', 'Aion Group', 'Black Saab 9-3'])
  })

  it('starts empty, because a machine that already knows everyone is a database', () => {
    mount(<DirectoryApp />, new Set())
    expect(screen.getByRole('listbox', { name: 'Directory' })).toBeEmptyDOMElement()
    expect(screen.getByText('Nobody yet.')).toBeInTheDocument()
  })

  it('counts what has been found and what has not', async () => {
    await openMarc()

    expect(screen.getByText('Mail')).toBeInTheDocument()
    expect(screen.getByText(/2 found · 4 not yet found/)).toBeInTheDocument()
    // Stored ISO so it sorts; shown the way the menu bar shows a date.
    expect(screen.getByText(/First appears 2 Mar 2009 · last 4 Mar 2009/)).toBeInTheDocument()
    // The gap is a number, never a list: it must not name what has not been found.
    expect(screen.queryByText(/SAAB SERVICE MTL/)).not.toBeInTheDocument()
  })

  it('says how many traces of a fact are still out there', async () => {
    await openMarc()
    expect(screen.getByText(/2 of 4 traces found/)).toBeInTheDocument()
  })

  it('writes a rumour as reported speech, never as a statement of fact', async () => {
    const user = userEvent.setup()
    mount(<DirectoryApp />, new Set(['mail-1', 'photo-1', 'mail-2', 'gossip']))
    await user.click(screen.getByRole('option', { name: 'Marc Trudeau' }))

    // Asserted: a plain sentence.
    expect(screen.getByText('Marc Trudeau works for Aion Group.')).toBeInTheDocument()
    // Inferred: the same sentence, marked as the player's own work.
    expect(
      screen.getByText('Marc Trudeau owns Black Saab 9-3. — you worked this out'),
    ).toBeInTheDocument()
    // Rumoured: the sentence shape itself changes, so it cannot be skimmed as a document.
    expect(screen.getByText('Somebody says marc Trudeau knows Lena Marchetti.')).toBeInTheDocument()
    expect(screen.queryByText('Marc Trudeau knows Lena Marchetti.')).not.toBeInTheDocument()

    // And the difference is never carried by colour alone.
    expect(screen.getByText('ON RECORD')).toBeInTheDocument()
    expect(screen.getByText('INFERRED')).toBeInTheDocument()
    expect(screen.getByText('CLAIMED — UNVERIFIED')).toBeInTheDocument()
  })

  it('groups relations under their confidence, in descending certainty', async () => {
    const user = userEvent.setup()
    mount(<DirectoryApp />, new Set(['mail-1', 'photo-1', 'mail-2', 'gossip']))
    await user.click(screen.getByRole('option', { name: 'Marc Trudeau' }))
    const headings = [...document.querySelectorAll('[data-confidence]')].map((el) =>
      el.getAttribute('data-confidence'),
    )
    expect(headings).toEqual(['asserted', 'inferred', 'rumoured'])
  })

  /**
   * The leak this page could most easily become. An alphabetical list of everyone in the season,
   * on the first morning, with their metadata filled in, is the whole story handed over — and it
   * is not what a machine in 2009 would have held.
   */
  it('does not list a stranger, however much the world knows about them', () => {
    mount(<DirectoryApp />)
    const list = screen.getByRole('listbox', { name: 'Directory' })
    expect(within(list).queryByRole('option', { name: 'Marc Delacroix' })).not.toBeInTheDocument()
    expect(within(list).queryByRole('option', { name: 'Lena Marchetti' })).not.toBeInTheDocument()
  })

  /**
   * The chain is the game. A page that lists every connection the world holds, under a heading
   * promising the player has seen where each came from, gives away the investigation and lies
   * about it in the same sentence.
   */
  it('shows only the connections the player could actually have made', async () => {
    await openMarc()

    // mail-1 and photo-1 both name Marc and the Saab: he owns it, and they worked that out.
    expect(screen.getByText(/owns Black Saab 9-3/)).toBeInTheDocument()
    // The payroll mail names Marc and Aion, and has not been read.
    expect(screen.queryByText(/works for Aion Group/)).not.toBeInTheDocument()
  })

  it('adds a connection once the document behind it is read', async () => {
    const user = userEvent.setup()
    mount(<DirectoryApp />, new Set(['mail-1', 'photo-1', 'mail-2']))
    await user.click(screen.getByRole('option', { name: 'Marc Trudeau' }))
    expect(screen.getByText('Marc Trudeau works for Aion Group.')).toBeInTheDocument()
  })

  it('lets a name arrive the way a name should — through somebody you do know', async () => {
    const user = userEvent.setup()
    mount(<DirectoryApp />, new Set(['mail-1', 'photo-1', 'gossip']))
    await user.click(screen.getByRole('option', { name: 'Marc Trudeau' }))
    // Lena is not in the list, but she is on Marc's page, as a rumour and written like one.
    expect(screen.getByText('Somebody says marc Trudeau knows Lena Marchetti.')).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Lena Marchetti' })).not.toBeInTheDocument()
  })
})
