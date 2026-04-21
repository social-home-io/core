/**
 * SpaceInviteDialog — create and share invite links (§23.62).
 */
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Modal } from './Modal'
import { Button } from './Button'
import { showToast } from './Toast'

const open = signal(false)
const spaceId = signal('')
const inviteToken = signal('')
const uses = signal(1)
const loading = signal(false)

export function openSpaceInvite(sid: string) {
  spaceId.value = sid
  inviteToken.value = ''
  uses.value = 1
  open.value = true
}

export function SpaceInviteDialog() {
  const createToken = async () => {
    loading.value = true
    try {
      const result = await api.post(`/api/spaces/${spaceId.value}/invite-tokens`, {
        uses: uses.value,
      })
      inviteToken.value = result.token
    } catch (e: any) {
      showToast(e.message || 'Failed to create invite', 'error')
    } finally {
      loading.value = false
    }
  }

  const copyLink = () => {
    const link = `${location.origin}/join?token=${inviteToken.value}`
    navigator.clipboard.writeText(link)
    showToast('Invite link copied!', 'success')
  }

  return (
    <Modal open={open.value} onClose={() => open.value = false} title="Invite to Space">
      <div class="sh-form">
        {!inviteToken.value ? (
          <>
            <label>
              Number of uses
              <input type="number" min={1} max={100} value={uses.value}
                onInput={(e) => uses.value = parseInt((e.target as HTMLInputElement).value) || 1} />
            </label>
            <Button onClick={createToken} loading={loading.value}>
              Generate invite link
            </Button>
          </>
        ) : (
          <div class="sh-invite-result">
            <p>Share this invite token:</p>
            <code class="sh-invite-token">{inviteToken.value}</code>
            <Button onClick={copyLink}>Copy link</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
