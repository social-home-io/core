/**
 * ModerationQueue — admin review UI for moderated content (§23.96/§23.97).
 *
 * Fetches `/api/spaces/{spaceId}/moderation` on mount and on every
 * ``spaceId`` change, then lets the admin approve or reject each item.
 * Rejection pops a ``RejectReasonDialog`` for the reason textarea.
 */
import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Button } from './Button'
import { showToast } from './Toast'
import { Spinner } from './Spinner'
import { openRejectReason } from './RejectReasonDialog'

interface QueueItem {
  id: string
  space_id: string
  feature: string
  action: string
  submitted_by: string
  payload: Record<string, unknown>
  status: string
  submitted_at: string
  expires_at: string
  rejection_reason?: string | null
}

const items = signal<QueueItem[]>([])
const loading = signal(true)
const error = signal<string | null>(null)

export function ModerationQueue({ spaceId }: { spaceId: string }) {
  useEffect(() => {
    let cancelled = false
    loading.value = true
    error.value = null
    api.get(`/api/spaces/${spaceId}/moderation`)
      .then((data: QueueItem[]) => {
        if (cancelled) return
        items.value = data
      })
      .catch((e: Error) => {
        if (cancelled) return
        error.value = e.message || 'Failed to load queue'
      })
      .finally(() => {
        if (!cancelled) loading.value = false
      })
    return () => {
      cancelled = true
    }
  }, [spaceId])

  const approve = async (itemId: string) => {
    const prev = items.value
    items.value = items.value.filter(i => i.id !== itemId)
    try {
      await api.post(`/api/spaces/${spaceId}/moderation/${itemId}/approve`)
      showToast('Content approved', 'success')
    } catch (e: any) {
      items.value = prev
      showToast(e.message || 'Approval failed', 'error')
    }
  }

  const reject = (itemId: string) => {
    openRejectReason({
      title: 'Reject this submission?',
      label: 'Reason (optional — shown to the submitter)',
      onSubmit: async (reason) => {
        const prev = items.value
        items.value = items.value.filter(i => i.id !== itemId)
        try {
          await api.post(
            `/api/spaces/${spaceId}/moderation/${itemId}/reject`,
            { reason },
          )
          showToast('Content rejected', 'info')
        } catch (e: any) {
          items.value = prev
          showToast(e.message || 'Rejection failed', 'error')
        }
      },
    })
  }

  if (loading.value) return <Spinner />
  if (error.value) {
    return (
      <div class="sh-moderation" role="alert">
        <h3>Moderation Queue</h3>
        <p class="sh-error">{error.value}</p>
      </div>
    )
  }

  return (
    <div class="sh-moderation">
      <h3>Moderation Queue</h3>
      {items.value.length === 0 && (
        <p class="sh-muted">No content pending review.</p>
      )}
      {items.value.map(item => (
        <div key={item.id} class="sh-moderation-item">
          <div class="sh-moderation-meta">
            <span>By: {item.submitted_by}</span>
            <span class="sh-muted">{item.feature} / {item.action}</span>
            <time>{new Date(item.submitted_at).toLocaleString()}</time>
          </div>
          <pre class="sh-moderation-payload">
            {JSON.stringify(item.payload, null, 2)}
          </pre>
          <div class="sh-moderation-actions">
            <Button onClick={() => approve(item.id)}>Approve</Button>
            <Button variant="danger" onClick={() => reject(item.id)}>
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}


/**
 * ContentReportsList — admin review for user reports (§23.97).
 *
 * Lists pending reports from ``/api/admin/reports`` and lets the admin
 * resolve them. Appears inside the AdminPage moderation tab.
 */
interface ReportRow {
  id: string
  target_type: string
  target_id: string
  reporter_user_id: string
  reporter_instance_id: string | null
  category: string
  notes: string | null
  status: string
  created_at: string
}

const reports = signal<ReportRow[]>([])
const reportsLoading = signal(true)
const reportsError = signal<string | null>(null)

export function ContentReportsList() {
  useEffect(() => {
    let cancelled = false
    reportsLoading.value = true
    reportsError.value = null
    api.get('/api/admin/reports')
      .then((data: ReportRow[]) => {
        if (!cancelled) reports.value = data
      })
      .catch((e: Error) => {
        if (!cancelled) reportsError.value = e.message || 'Failed to load reports'
      })
      .finally(() => {
        if (!cancelled) reportsLoading.value = false
      })
    return () => {
      cancelled = true
    }
  }, [])

  const resolve = async (id: string, dismissed = false) => {
    const prev = reports.value
    reports.value = reports.value.filter(r => r.id !== id)
    try {
      await api.post(`/api/admin/reports/${id}/resolve`, { dismissed })
      showToast(dismissed ? 'Report dismissed' : 'Report resolved', 'success')
    } catch (e: any) {
      reports.value = prev
      showToast(e.message || 'Resolve failed', 'error')
    }
  }

  if (reportsLoading.value) return <Spinner />
  if (reportsError.value) {
    return (
      <div class="sh-reports" role="alert">
        <h3>Content Reports</h3>
        <p class="sh-error">{reportsError.value}</p>
      </div>
    )
  }

  return (
    <div class="sh-reports">
      <h3>Content Reports</h3>
      {reports.value.length === 0 && (
        <p class="sh-muted">No pending reports.</p>
      )}
      {reports.value.map(r => (
        <div key={r.id} class="sh-report-row">
          <div class="sh-report-meta">
            <span>{r.category} · {r.target_type} {r.target_id}</span>
            <span class="sh-muted">by {r.reporter_user_id}</span>
            {r.reporter_instance_id && (
              <span class="sh-badge sh-badge--peer"
                    title={`Report mirrored from peer ${r.reporter_instance_id}`}>
                from peer
              </span>
            )}
            <time>{new Date(r.created_at).toLocaleString()}</time>
          </div>
          {r.notes && <p class="sh-muted">{r.notes}</p>}
          <div class="sh-form-actions">
            <Button onClick={() => resolve(r.id)}>Resolve</Button>
            <Button variant="secondary" onClick={() => resolve(r.id, true)}>
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
