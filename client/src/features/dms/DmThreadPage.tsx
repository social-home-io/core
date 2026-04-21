import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import { useRoute, useLocation } from 'preact-iso'
import { api } from '@/api'
import { ws } from '@/ws'
import type { Message } from '@/types'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/Button'
import { showToast } from '@/components/Toast'
import { ReadReceipt, readReceiptsEnabled } from '@/components/ReadReceipts'
import { TypingIndicator, sendTyping } from '@/components/TypingIndicator'
import { currentUser } from '@/store/auth'

const messages = signal<Message[]>([])
const loading = signal(true)
const readMessageIds = signal<Set<string>>(new Set())
const memberCount = signal<number>(0)

/**
 * Render a ``type="call_event"`` system message as a compact centred row
 * in the DM thread (spec §26.8). The backend stores a JSON blob describing
 * the event; we parse it at render-time and offer a one-tap "Call back"
 * on missed/declined events.
 */
function CallEventRow({ m, onCallBack }: { m: Message, onCallBack: (type: 'audio' | 'video') => void }) {
  let ev: { event?: string, call_type?: string, duration_seconds?: number | null } = {}
  try { ev = JSON.parse(m.content) } catch { /* noop */ }
  const ic = ev.call_type === 'video' ? '📹' : '📞'
  const label = ev.event === 'missed' ? 'Missed call'
    : ev.event === 'declined' ? 'Declined call'
    : ev.event === 'ended'    ? 'Call'
    : 'Call started'
  const dur = ev.duration_seconds && ev.duration_seconds > 0
    ? ` · ${formatDuration(ev.duration_seconds)}` : ''
  const when = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const showBack = ev.event === 'missed' || ev.event === 'declined'
  return (
    <div class="sh-call-event">
      <span class="sh-call-event-icon">{ic}</span>
      <span class="sh-call-event-label">{label}</span>
      <span class="sh-call-event-meta">{dur} · {when}</span>
      {showBack && (
        <Button onClick={() => onCallBack((ev.call_type as 'audio' | 'video') ?? 'audio')}>
          Call back
        </Button>
      )}
    </div>
  )
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

/** Thread-header call buttons (§26.2). */
function CallButtons({ convId, onStart }: { convId: string, onStart: (t: 'audio' | 'video') => void }) {
  // Only meaningful when the DM has ≥ 1 peer.
  if (memberCount.value < 2) return null
  return (
    <div class="sh-thread-call-buttons">
      <button type="button" class="sh-icon-btn" title="Audio call"
              onClick={() => onStart('audio')}
              aria-label={`Start audio call in conversation ${convId}`}>📞</button>
      <button type="button" class="sh-icon-btn" title="Video call"
              onClick={() => onStart('video')}
              aria-label={`Start video call in conversation ${convId}`}>📹</button>
    </div>
  )
}

export default function DmThreadPage() {
  const { params } = useRoute()
  const convId = params.id
  const location = useLocation()

  useEffect(() => {
    loading.value = true
    api.get(`/api/conversations/${convId}/messages`).then(data => {
      messages.value = data.reverse()
      loading.value = false
      if (readReceiptsEnabled.value) {
        api.post(`/api/conversations/${convId}/read`).catch(() => {})
      }
    })
    // Member count drives the call-button visibility.
    api.get(`/api/conversations/${convId}`).then((c: { member_count?: number }) => {
      memberCount.value = c?.member_count ?? 2
    }).catch(() => { memberCount.value = 2 })

    const offTyping = ws.on('dm.typing', (evt) => {
      const data = evt.data as { conversation_id?: string; user_id?: string }
      if (data.conversation_id === convId) {
        ws.send('typing', { user_id: data.user_id })
      }
    })
    const offRead = ws.on('dm.read', (evt) => {
      const data = evt.data as { conversation_id?: string; message_ids?: string[] }
      if (data.conversation_id === convId && data.message_ids) {
        readMessageIds.value = new Set([...readMessageIds.value, ...data.message_ids])
      }
    })
    const offNewMsg = ws.on('dm.message', (evt) => {
      const data = evt.data as { conversation_id?: string; message?: Message }
      if (data.conversation_id === convId && data.message) {
        if (!messages.value.some(m => m.id === data.message!.id)) {
          messages.value = [...messages.value, data.message]
        }
        if (readReceiptsEnabled.value) {
          api.post(`/api/conversations/${convId}/read`).catch(() => {})
        }
      }
    })
    return () => { offTyping(); offRead(); offNewMsg() }
  }, [convId])

  let typingTimer: ReturnType<typeof setTimeout> | null = null

  const handleInput = () => {
    if (typingTimer) return
    sendTyping(convId)
    typingTimer = setTimeout(() => { typingTimer = null }, 2000)
  }

  const handleSend = async (e: Event) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const content = new FormData(form).get('content') as string
    if (!content.trim()) return
    try {
      await api.post(`/api/conversations/${convId}/messages`, { content })
      form.reset()
      const data = await api.get(`/api/conversations/${convId}/messages`)
      messages.value = data.reverse()
    } catch (err: unknown) {
      showToast(
        `Send failed: ${(err as Error)?.message ?? err}`,
        'error',
      )
    }
  }

  const startCall = async (callType: 'audio' | 'video') => {
    // For v1 the backend expects a placeholder SDP — the real offer is
    // generated by ``InCallPage`` on mount via ``RtcTransport``.
    const r = await api.post('/api/calls', {
      conversation_id: convId,
      call_type: callType,
      sdp_offer: 'v=0\r\n',
    }) as { call_id: string }
    location.route(`/calls/${r.call_id}`)
  }

  if (loading.value) return <Spinner />
  const myUserId = currentUser.value?.user_id

  return (
    <div class="sh-thread">
      <div class="sh-thread-header">
        <CallButtons convId={convId} onStart={startCall} />
        <a class="sh-link" href={`/dms/${convId}/calls`}>History</a>
      </div>
      <div class="sh-messages">
        {messages.value.map(m => {
          if (m.type === 'call_event') {
            return <CallEventRow key={m.id} m={m} onCallBack={startCall} />
          }
          const mine = m.sender_user_id === myUserId
          return (
            <div
              key={m.id}
              class={`sh-message ${mine ? 'sh-message--mine' : ''} ${m.deleted ? 'sh-message--deleted' : ''}`}
            >
              {!mine && <strong>{m.sender_user_id}</strong>}
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {m.deleted ? '(message deleted)' : m.content}
              </p>
              <div class="sh-message-meta">
                <time>{new Date(m.created_at).toLocaleTimeString([],
                  { hour: '2-digit', minute: '2-digit' })}</time>
                {mine && (
                  <ReadReceipt
                    sent={true}
                    delivered={true}
                    read={readMessageIds.value.has(m.id)}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <TypingIndicator scope={convId} />
      <form class="sh-composer" onSubmit={handleSend}>
        <input name="content" placeholder="Type a message..." autocomplete="off"
          onInput={handleInput} />
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}
