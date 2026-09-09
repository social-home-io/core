import { describe, it, expect, vi, beforeEach } from 'vitest'

// The heavy DmThreadPage cold render (fresh ``import()`` + mocked-API
// microtask chain + layout effects) can take several seconds under the full
// parallel suite on CI. TWO ceilings have to clear it or these tests flake:
//   1. vitest's per-test timeout — defaults to 5 s, which *kills the whole
//      test* ("Test timed out in 5000ms") before any inner ``waitFor`` can
//      help. Raise it for this file.
//   2. the ``waitFor`` budget below — must sit *under* the per-test timeout so
//      a genuinely-stuck wait fails with a useful assertion rather than the
//      opaque test-timeout error.
// Both resolve as soon as the condition holds, so the generous ceilings cost
// nothing on a fast run — they only add headroom under load.
vi.setConfig({ testTimeout: 20_000 })
const RENDER_WAIT = 15_000

// NOTE: ``@/api`` and ``@/store/auth`` are mocked ONCE each, further down
// next to the fixtures they serve. This file used to register a second,
// competing factory for both up here — an easy mistake, because
// ``vi.mock`` is hoisted so the two registrations look far apart in the
// source but land on the same module id. The first ``@/api`` factory
// hardwired ``get`` to ``mockResolvedValue([])``, which no test could
// steer; whenever the registry served that one instead of the
// delegating factory below, every fetch resolved empty, the thread
// rendered no messages, and the four "jump-down chip integration"
// tests burned their full waitFor budget. It presented as a CI-only
// flake for months (see the ceilings above and the fork cap in
// vitest.config.ts, both of which were attempts at this symptom).
// Keep exactly one factory per module id.

describe('DmThreadPage', () => {
  it('module exports a default component', async () => {
    const mod = await import('./DmThreadPage')
    expect(mod.default).toBeTruthy()
    expect(typeof mod.default).toBe('function')
  })
})

describe('isAtLiveEdge', () => {
  // The "live edge" threshold (80 px) is the shared input to two
  // call sites: the user-scroll handler (``handleScroll``) and the
  // notification-driven entry effect (the anchor-scroll
  // ``useLayoutEffect``). Both must agree, or the jump-down chip
  // shows when the user is visually at the bottom — which is the
  // exact bug the helper unifies.

  it('treats a column-reverse container at scrollTop=0 as the live edge', async () => {
    // Chrome / Safari / Edge / modern Firefox land at scrollTop=0
    // when the latest message is in view in a column-reverse list.
    const { isAtLiveEdge } = await import('./DmThreadPage')
    expect(isAtLiveEdge({
      scrollTop: 0,
      scrollHeight: 800,
      clientHeight: 600,
    })).toBe(true)
  })

  it('returns true when within 80 px of the bottom (slack window)', async () => {
    const { isAtLiveEdge } = await import('./DmThreadPage')
    expect(isAtLiveEdge({
      scrollTop: -79,
      scrollHeight: 800,
      clientHeight: 600,
    })).toBe(true)
  })

  it('returns false past the 80 px slack window', async () => {
    const { isAtLiveEdge } = await import('./DmThreadPage')
    expect(isAtLiveEdge({
      scrollTop: -200,
      scrollHeight: 800,
      clientHeight: 600,
    })).toBe(false)
  })

  it('also handles the legacy positive-scrollTop convention', async () => {
    // ``scrollTop = maxScroll`` is the visual bottom on older
    // Firefox's positive-scrollTop column-reverse.
    const { isAtLiveEdge } = await import('./DmThreadPage')
    expect(isAtLiveEdge({
      scrollTop: 200,
      scrollHeight: 800,
      clientHeight: 600,
    })).toBe(true)
  })

  it('returns true when the content fits in the viewport (no scrollable range)', async () => {
    // Regression for the reported notification → DM flow: a single
    // unread message at the bottom can mean ``scrollHeight ==
    // clientHeight`` (or close enough), so ``distFromBottom = 0``
    // and the user is at the live edge — the chip must NOT render.
    const { isAtLiveEdge } = await import('./DmThreadPage')
    expect(isAtLiveEdge({
      scrollTop: 0,
      scrollHeight: 600,
      clientHeight: 600,
    })).toBe(true)
  })
})

// ── Integration: mount DmThreadPage and assert the chip's render ─
// state matches the scroll-position story. jsdom doesn't lay out,
// so ``scrollHeight`` / ``clientHeight`` / ``scrollTop`` default to
// 0. We override them via ``Object.defineProperty`` to drive the
// two ends of the live-edge condition. Verifies the wiring between
// the layout effect, the post-paint follow-up, and the tail-
// tracking guard — not just the helper math.

const apiGet = vi.fn()
const apiPost = vi.fn()

/** Mutable route holder read by the single ``preact-iso`` factory
 *  below. Defaults to ``'conv-test'`` so every test that doesn't care
 *  sees the historical pinned id; the stale-response test flips it
 *  mid-flight to simulate the user switching threads. A holder (not a
 *  second ``vi.mock`` factory) keeps the "exactly one factory per
 *  module id" invariant the flake fix established. */
const routeState = { convId: 'conv-test' }

vi.mock('preact-iso', () => ({
  // Pin the route so DmThreadPage's ``useRoute().params.id`` resolves
  // to a known conv-id; the real router would set this via
  // ``<Route path="/dms/:id">`` but we're mounting the page directly.
  useRoute: () => ({
    params: { id: routeState.convId },
    path: `/dms/${routeState.convId}`,
  }),
  useLocation: () => ({ url: `/dms/${routeState.convId}`, route: vi.fn() }),
  lazy: (fn: () => Promise<{ default: unknown }>) => fn,
  LocationProvider: ({ children }: { children: unknown }) => children,
  Router: ({ children }: { children: unknown }) => children,
  Route: ({ component: C }: { component: () => unknown }) => C(),
  hydrate: vi.fn(),
  prerender: vi.fn(),
  ErrorBoundary: ({ children }: { children: unknown }) => children,
}))

vi.mock('@/api', async () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
    upload: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/ws', () => ({
  ws: { on: vi.fn(() => () => {}), send: vi.fn() },
}))

vi.mock('@/store/auth', () => ({
  currentUser: { value: { user_id: 'u-me', username: 'me', display_name: 'Me', is_admin: false, picture_url: null, bio: null, is_new_member: false } },
  token: { value: 't' },
  isAuthed: { value: true },
  setToken: vi.fn(),
  logout: vi.fn(),
}))

interface MockApiResponses {
  conversations: unknown[]
  messages: unknown[]
  members?: unknown[]
}

function wireApiMock(fixtures: MockApiResponses): void {
  apiGet.mockImplementation(async (url: string) => {
    if (url === '/api/conversations') return fixtures.conversations
    if (url.startsWith('/api/conversations/conv-test/messages')) {
      return fixtures.messages
    }
    if (url.startsWith('/api/conversations/conv-test/members')) {
      return fixtures.members ?? []
    }
    return []
  })
}

/** Force the messages scroll container's metrics so the live-edge
 *  math evaluates as if we were really laid out. jsdom returns 0
 *  for these by default, so without overriding the test would see
 *  ``distFromBottom = 0`` regardless of what we want to simulate. */
function stubScrollMetrics(opts: {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}): () => void {
  const proto = HTMLElement.prototype
  const orig = {
    scrollTop: Object.getOwnPropertyDescriptor(proto, 'scrollTop'),
    scrollHeight: Object.getOwnPropertyDescriptor(proto, 'scrollHeight'),
    clientHeight: Object.getOwnPropertyDescriptor(proto, 'clientHeight'),
  }
  Object.defineProperty(proto, 'scrollTop', {
    configurable: true, get: () => opts.scrollTop, set: () => {},
  })
  Object.defineProperty(proto, 'scrollHeight', {
    configurable: true, get: () => opts.scrollHeight,
  })
  Object.defineProperty(proto, 'clientHeight', {
    configurable: true, get: () => opts.clientHeight,
  })
  // ``scrollIntoView`` is a no-op in jsdom; this matches what
  // happens in production when the anchor message is already at the
  // visual bottom (the call does nothing because scrollTop is
  // already 0).
  if (!proto.scrollIntoView) {
    Object.defineProperty(proto, 'scrollIntoView', {
      configurable: true, value: () => {},
    })
  }
  return () => {
    if (orig.scrollTop) Object.defineProperty(proto, 'scrollTop', orig.scrollTop)
    if (orig.scrollHeight) Object.defineProperty(proto, 'scrollHeight', orig.scrollHeight)
    if (orig.clientHeight) Object.defineProperty(proto, 'clientHeight', orig.clientHeight)
  }
}

beforeEach(() => {
  vi.resetModules()
  apiGet.mockReset()
  apiPost.mockReset()
  apiPost.mockResolvedValue({})
  routeState.convId = 'conv-test'
})

describe('DmThreadPage — jump-down chip integration', () => {
  it('does NOT render the chip when the entry-scroll lands at the visual bottom', async () => {
    const restore = stubScrollMetrics({
      scrollTop: 0, scrollHeight: 600, clientHeight: 600,
    })
    try {
      wireApiMock({
        conversations: [{
          id: 'conv-test',
          type: 'dm',
          name: null,
          last_message_at: '2026-05-17T13:00:42+00:00',
          members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null }],
          member_count: 2,
          unread: 1,
          last_read_at: '2026-05-17T13:00:29+00:00',
        }],
        messages: [{
          id: 'msg-new',
          sender_user_id: 'u-bob',
          content: 'BUG-REPRO: only one new message',
          type: 'text',
          media_url: null, file_name: null, mime_type: null,
          file_size_bytes: null, reply_to_id: null,
          reactions: [], deleted: false,
          created_at: '2026-05-17T13:00:42+00:00',
          edited_at: null,
        }],
        members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null, is_online: false, is_idle: false, last_seen_at: null }],
      })
      const { render, waitFor } = await import('@testing-library/preact')
      const { default: DmThreadPage } = await import('./DmThreadPage')
      const { container } = render(<DmThreadPage />)
      await waitFor(() => {
        expect(container.textContent ?? '').toContain('BUG-REPRO')
      }, { timeout: RENDER_WAIT })
      // Give the layout effect + the follow-up useEffect a tick to settle.
      await new Promise(r => setTimeout(r, 50))
      const chip = container.querySelector('.sh-dm-jump-down')
      expect(chip).toBeNull()
    } finally {
      restore()
    }
  })

  it('DOES render the "New messages" divider when entering scrolled-up with unread', async () => {
    // Bigger scroll range + scrollTop well past the 80 px slack →
    // the entry-scroll's distFromBottom resolves to > 80, so the
    // anchor stays put and the "New messages" divider surfaces.
    // Confirms the fix didn't strip the divider in the legitimate
    // case (the chip itself only appears on subsequent WS arrivals
    // — entry-with-unread surfaces the divider, not the chip).
    const restore = stubScrollMetrics({
      scrollTop: -400, scrollHeight: 2000, clientHeight: 600,
    })
    try {
      wireApiMock({
        conversations: [{
          id: 'conv-test',
          type: 'dm',
          name: null,
          last_message_at: '2026-05-17T13:00:42+00:00',
          members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null }],
          member_count: 2,
          unread: 5,
          last_read_at: '2026-05-17T12:00:00+00:00',
        }],
        // Backend returns ``ORDER BY created_at DESC`` (newest first);
        // the SPA reverses to render oldest→newest. Fixture mirrors
        // the DESC shape: index 0 = newest, index 29 = oldest. Newest
        // 5 are unread (after last_read_at).
        messages: Array.from({ length: 30 }).map((_, i) => ({
          id: `msg-${29 - i}`,
          sender_user_id: 'u-bob',
          content: `msg ${29 - i}`,
          type: 'text',
          media_url: null, file_name: null, mime_type: null,
          file_size_bytes: null, reply_to_id: null,
          reactions: [], deleted: false,
          created_at: i < 5
            ? '2026-05-17T13:00:42+00:00'
            : '2026-05-17T11:00:00+00:00',
          edited_at: null,
        })),
        members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null, is_online: false, is_idle: false, last_seen_at: null }],
      })
      const { render, waitFor } = await import('@testing-library/preact')
      const { default: DmThreadPage } = await import('./DmThreadPage')
      const { container } = render(<DmThreadPage />)
      await waitFor(() => {
        expect(container.querySelectorAll('[data-msg-id]').length).toBeGreaterThan(0)
      }, { timeout: RENDER_WAIT })
      await new Promise(r => setTimeout(r, 50))
      // distFromBottom = 400 > 80 so the entry-scroll layout effect
      // leaves stickToBottom=false. The follow-up effect must NOT
      // fire the read-mark POST — the user hasn't actually caught
      // up. The chip itself stays hidden because the tail-tracking
      // guard skips the initial population.
      const readPosts = apiPost.mock.calls.filter(
        ([url]) => typeof url === 'string'
          && url.startsWith('/api/conversations/conv-test/read'),
      )
      expect(readPosts).toHaveLength(0)
      const chip = container.querySelector('.sh-dm-jump-down')
      expect(chip).toBeNull()
    } finally {
      restore()
    }
  })

  it('auto-stamps the read watermark when entry-scroll lands at the live edge', async () => {
    // Positive-shape companion to the test above: when
    // ``isAtLiveEdge`` resolves to true, the follow-up useEffect
    // fires the read-mark POST. This is the contract that keeps
    // a subsequent inbound WS message from surfacing a chip the
    // user has already "seen" in the same entry.
    const restore = stubScrollMetrics({
      scrollTop: 0, scrollHeight: 600, clientHeight: 600,
    })
    try {
      wireApiMock({
        conversations: [{
          id: 'conv-test',
          type: 'dm',
          name: null,
          last_message_at: '2026-05-17T13:00:42+00:00',
          members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null }],
          member_count: 2,
          unread: 1,
          last_read_at: '2026-05-17T13:00:29+00:00',
        }],
        messages: [{
          id: 'msg-new',
          sender_user_id: 'u-bob',
          content: 'only one new message',
          type: 'text',
          media_url: null, file_name: null, mime_type: null,
          file_size_bytes: null, reply_to_id: null,
          reactions: [], deleted: false,
          created_at: '2026-05-17T13:00:42+00:00',
          edited_at: null,
        }],
        members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null, is_online: false, is_idle: false, last_seen_at: null }],
      })
      const { render, waitFor } = await import('@testing-library/preact')
      const { default: DmThreadPage } = await import('./DmThreadPage')
      const { container } = render(<DmThreadPage />)
      await waitFor(() => {
        expect(container.querySelectorAll('[data-msg-id]').length).toBeGreaterThan(0)
      }, { timeout: RENDER_WAIT })
      // Poll for the read-mark POST rather than a fixed sleep — the
      // follow-up effect fires it post-render, and a fixed delay races it
      // under CI load.
      await waitFor(() => {
        const readPosts = apiPost.mock.calls.filter(
          ([url]) => typeof url === 'string'
            && url.startsWith('/api/conversations/conv-test/read'),
        )
        expect(readPosts.length).toBeGreaterThanOrEqual(1)
      }, { timeout: RENDER_WAIT })
    } finally {
      restore()
    }
  })

  it('renders an inline react chip on each message bubble (desktop affordance)', async () => {
    // Pre-fix the desktop user had no way to add a reaction: the
    // ``ReactionPicker`` was only reachable from the touch-only
    // ``MessageContextSheet`` (long-press). The hover affordance now
    // sits as a ``.sh-message-react-btn`` next to the existing
    // ``.sh-message-reply-btn`` so mouse users can open the picker
    // by clicking the smiley.
    const restore = stubScrollMetrics({
      scrollTop: 0, scrollHeight: 600, clientHeight: 600,
    })
    try {
      wireApiMock({
        conversations: [{
          id: 'conv-test',
          type: 'dm',
          name: null,
          last_message_at: '2026-05-17T13:00:42+00:00',
          members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null }],
          member_count: 2,
          unread: 0,
          last_read_at: '2026-05-17T13:00:42+00:00',
        }],
        messages: [{
          id: 'msg-1',
          sender_user_id: 'u-bob',
          content: 'hello',
          type: 'text',
          media_url: null, file_name: null, mime_type: null,
          file_size_bytes: null, reply_to_id: null,
          reactions: [], deleted: false,
          created_at: '2026-05-17T13:00:42+00:00',
          edited_at: null,
        }],
        members: [{
          user_id: 'u-bob', username: 'bob', display_name: 'Bob',
          picture_url: null, is_online: false, is_idle: false, last_seen_at: null,
        }],
      })
      const { render, waitFor } = await import('@testing-library/preact')
      const { default: DmThreadPage } = await import('./DmThreadPage')
      const { container } = render(<DmThreadPage />)
      await waitFor(() => {
        expect(container.textContent ?? '').toContain('hello')
      }, { timeout: RENDER_WAIT })
      // Both buttons are siblings on the bubble — Reply ↩ closer to
      // the bubble, React 😊 the further-out chip. The privacy /
      // hover-CSS contract lives in app.css; this test just pins
      // that the DOM nodes exist on a non-deleted message.
      const reactBtn = container.querySelector('.sh-message-react-btn')
      const replyBtn = container.querySelector('.sh-message-reply-btn')
      expect(reactBtn).not.toBeNull()
      expect(replyBtn).not.toBeNull()
    } finally {
      restore()
    }
  })

  it('emits ws.send(\'dm.active\', {conversation_id}) on mount and clears on unmount', async () => {
    // The active-conversation signal — tells the backend "don't fire
    // the bell row + push for me on this thread, I'm reading it right
    // now". Without it the user gets a notification for a DM they're
    // actively typing a reply to, which is the exact noise we're
    // fixing.
    const restore = stubScrollMetrics({
      scrollTop: 0, scrollHeight: 600, clientHeight: 600,
    })
    try {
      wireApiMock({
        conversations: [{
          id: 'conv-test', type: 'dm', name: null,
          last_message_at: '2026-05-17T13:00:42+00:00',
          members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null }],
          member_count: 2, unread: 0, last_read_at: '2026-05-17T13:00:42+00:00',
        }],
        messages: [],
        members: [{
          user_id: 'u-bob', username: 'bob', display_name: 'Bob',
          picture_url: null, is_online: false, is_idle: false, last_seen_at: null,
        }],
      })
      const { render, waitFor } = await import('@testing-library/preact')
      const { default: DmThreadPage } = await import('./DmThreadPage')
      const { ws } = await import('@/ws')
      const sendMock = ws.send as unknown as ReturnType<typeof vi.fn>
      sendMock.mockClear()
      const { unmount } = render(<DmThreadPage />)
      await waitFor(() => {
        expect(sendMock).toHaveBeenCalledWith('dm.active', { conversation_id: 'conv-test' })
      }, { timeout: RENDER_WAIT })
      sendMock.mockClear()
      unmount()
      // Cleanup effect must clear the marker so backgrounded threads
      // start emitting notifications again.
      expect(sendMock).toHaveBeenCalledWith('dm.active', { conversation_id: null })
    } finally {
      restore()
    }
  })
})

describe('DmThreadPage — composer mic⇄send swap', () => {
  // Regression: inserting an emoji as the FIRST composer character via
  // the picker mutates the textarea value programmatically, which does
  // NOT fire ``onInput`` — so the ``composerHasContent`` flag must be
  // refreshed by the splice itself, or the mic button never swaps to
  // Send and the user can't send an emoji-only first message.
  it('swaps mic→send when the first character is an emoji from the picker', async () => {
    wireApiMock({
      conversations: [{
        id: 'conv-test',
        type: 'dm',
        name: null,
        last_message_at: '2026-05-17T13:00:42+00:00',
        members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null }],
        member_count: 2,
        unread: 0,
        last_read_at: '2026-05-17T13:00:42+00:00',
      }],
      messages: [],
      members: [{
        user_id: 'u-bob', username: 'bob', display_name: 'Bob',
        picture_url: null, is_online: false, is_idle: false, last_seen_at: null,
      }],
    })
    const { render, waitFor, fireEvent } = await import('@testing-library/preact')
    const { default: DmThreadPage } = await import('./DmThreadPage')
    const { container } = render(<DmThreadPage />)
    await waitFor(() => {
      expect(container.querySelector('textarea[name="content"]')).not.toBeNull()
    }, { timeout: RENDER_WAIT })

    // Empty composer → no Send button, the voice-record slot owns it.
    expect(container.querySelector('[aria-label="Send message"]')).toBeNull()

    // Open the inline emoji picker and pick the first emoji.
    const emojiBtn = container.querySelector(
      '[aria-label="Insert emoji into message"]',
    ) as HTMLElement
    expect(emojiBtn).not.toBeNull()
    fireEvent.click(emojiBtn)
    const firstEmoji = await waitFor(() => {
      const el = container.querySelector('.sh-emoji-btn')
      expect(el).not.toBeNull()
      return el as HTMLElement
    }, { timeout: RENDER_WAIT })
    fireEvent.click(firstEmoji)

    // The composer now has content (an emoji), so the slot must show Send.
    await waitFor(() => {
      expect(container.querySelector('[aria-label="Send message"]')).not.toBeNull()
    }, { timeout: RENDER_WAIT })
  })
})

describe('DmThreadPage — load-effect failure isolation', () => {
  // The messages fetch used to carry a single trailing ``.catch`` that
  // was *documented* as the network-failure branch but structurally
  // also caught anything thrown by its own ~50-line success handler —
  // and its response was to blank the thread. So a bug in the
  // unread-anchor math (or, as here, in the fire-and-forget read POST)
  // presented to the user as "this conversation is empty", with no
  // toast and no log. The two paths are now separate: a rejected fetch
  // clears the skeleton and empties the list, a throw out of the
  // success handler leaves the rendered thread alone and logs.
  it('keeps the fetched messages on screen when the success handler throws', async () => {
    const restore = stubScrollMetrics({
      scrollTop: 0, scrollHeight: 600, clientHeight: 600,
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      wireApiMock({
        // ``unread: 0`` + ``last_read_at: null`` → no unread anchor, so
        // the success handler always reaches the mark-as-read POST.
        conversations: [{
          id: 'conv-test', type: 'dm', name: null,
          last_message_at: '2026-05-17T13:00:42+00:00',
          members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null }],
          member_count: 2, unread: 0, last_read_at: null,
        }],
        messages: [{
          id: 'msg-1',
          sender_user_id: 'u-bob',
          content: 'STILL-HERE: handler threw but the thread stands',
          type: 'text',
          media_url: null, file_name: null, mime_type: null,
          file_size_bytes: null, reply_to_id: null,
          reactions: [], deleted: false,
          created_at: '2026-05-17T13:00:42+00:00',
          edited_at: null,
        }],
        members: [{
          user_id: 'u-bob', username: 'bob', display_name: 'Bob',
          picture_url: null, is_online: false, is_idle: false, last_seen_at: null,
        }],
      })
      // Throw *synchronously* out of the read POST — the cheapest
      // reliable stand-in for a bug anywhere in the success handler.
      apiPost.mockImplementation(() => { throw new Error('boom') })

      const { render, waitFor } = await import('@testing-library/preact')
      const { default: DmThreadPage } = await import('./DmThreadPage')
      const { container } = render(<DmThreadPage />)
      // Wait until the handler has actually reached (and thrown from)
      // the read POST, so the assertion below is about the aftermath.
      await waitFor(() => {
        expect(apiPost.mock.calls.some(
          ([url]) => typeof url === 'string' && url.endsWith('/read'),
        )).toBe(true)
      }, { timeout: RENDER_WAIT })
      // Let the rejection propagate through its microtask + a render.
      await new Promise(r => setTimeout(r, 50))
      expect(container.textContent ?? '').toContain('STILL-HERE')
      // Silent failure was half the bug — the thread survives *and*
      // the throw is diagnosable, with the thread id in the log.
      expect(errSpy.mock.calls.some(
        args => args.some(a => typeof a === 'string' && a.includes('conv-test')),
      )).toBe(true)
    } finally {
      errSpy.mockRestore()
      restore()
    }
  })

  it('does not let a slow response from the previous thread overwrite the current one', async () => {
    // Switching threads re-runs the load effect, but the in-flight
    // request from the thread we just left still resolves — and every
    // continuation writes module-level signals. Without a per-run
    // staleness guard the late response repaints thread A's messages
    // over thread B, which the user reads as "wrong conversation".
    const restore = stubScrollMetrics({
      scrollTop: 0, scrollHeight: 600, clientHeight: 600,
    })
    try {
      const convRow = (id: string) => ({
        id, type: 'dm', name: null,
        last_message_at: '2026-05-17T13:00:42+00:00',
        members: [{ user_id: 'u-bob', username: 'bob', display_name: 'Bob', picture_url: null }],
        member_count: 2, unread: 0, last_read_at: null,
      })
      const msgRow = (id: string, content: string) => ({
        id, sender_user_id: 'u-bob', content, type: 'text',
        media_url: null, file_name: null, mime_type: null,
        file_size_bytes: null, reply_to_id: null,
        reactions: [], deleted: false,
        created_at: '2026-05-17T13:00:42+00:00',
        edited_at: null,
      })
      // Thread A's messages fetch never settles until we say so.
      let releaseA: (rows: unknown[]) => void = () => {}
      const slowA = new Promise<unknown[]>(res => { releaseA = res })
      apiGet.mockImplementation(async (url: string) => {
        if (url === '/api/conversations') return [convRow('conv-a'), convRow('conv-b')]
        if (url.startsWith('/api/conversations/conv-a/messages')) return slowA
        if (url.startsWith('/api/conversations/conv-b/messages')) {
          return [msgRow('msg-b', 'THREAD-B: the thread the user is looking at')]
        }
        if (url.endsWith('/members')) {
          return [{
            user_id: 'u-bob', username: 'bob', display_name: 'Bob',
            picture_url: null, is_online: false, is_idle: false, last_seen_at: null,
          }]
        }
        return []
      })

      routeState.convId = 'conv-a'
      const { render, waitFor } = await import('@testing-library/preact')
      const { default: DmThreadPage } = await import('./DmThreadPage')
      const { container, rerender } = render(<DmThreadPage />)
      // A's messages fetch is in flight (and pinned open).
      await waitFor(() => {
        expect(apiGet.mock.calls.some(
          ([url]) => typeof url === 'string'
            && url.startsWith('/api/conversations/conv-a/messages'),
        )).toBe(true)
      }, { timeout: RENDER_WAIT })

      // The user navigates to thread B; the effect re-runs against
      // the new id. ``key`` forces the remount the real router
      // performs on a route change — without it @preact/signals'
      // ``shouldComponentUpdate`` skips the re-render entirely (same
      // props, no dirty signal), so the effect would never see B.
      routeState.convId = 'conv-b'
      rerender(<DmThreadPage key="conv-b" />)
      await waitFor(() => {
        expect(container.textContent ?? '').toContain('THREAD-B')
      }, { timeout: RENDER_WAIT })

      // Only now does A's request come back.
      releaseA([msgRow('msg-a', 'THREAD-A: stale response from the thread we left')])
      await new Promise(r => setTimeout(r, 50))
      expect(container.textContent ?? '').toContain('THREAD-B')
      expect(container.textContent ?? '').not.toContain('THREAD-A')
    } finally {
      restore()
    }
  })
})
