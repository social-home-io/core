/**
 * OnboardingFlow — first-run experience (§23.1/§23.92).
 * Shown when currentUser.is_new_member is true.
 */
import { signal } from '@preact/signals'
import { api } from '@/api'
import { currentUser } from '@/store/auth'
import { Button } from './Button'
import { Avatar } from './Avatar'

const step = signal(0)

const STEPS = [
  {
    title: 'Welcome to Social Home!',
    body: 'Your private household social platform — connected to Home Assistant.',
  },
  {
    title: 'Your Feed',
    body: 'Post updates, share photos, create polls — everything stays within your household.',
  },
  {
    title: 'Spaces',
    body: 'Create spaces to organize conversations with friends and family across households.',
  },
  {
    title: 'Federation',
    body: "Connect with other households via QR code. Your data stays on your server — always encrypted in transit.",
  },
]

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const current = STEPS[step.value]
  const isLast = step.value === STEPS.length - 1

  const next = () => {
    if (isLast) {
      api.post('/api/me/onboarding-complete').catch(() => {})
      onComplete()
    } else {
      step.value++
    }
  }

  const skip = () => {
    api.post('/api/me/onboarding-complete').catch(() => {})
    onComplete()
  }

  return (
    <div class="sh-onboarding">
      <div class="sh-onboarding-card">
        <div class="sh-onboarding-step">{step.value + 1} / {STEPS.length}</div>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div class="sh-onboarding-dots">
          {STEPS.map((_, i) => (
            <span key={i} class={`sh-dot ${i === step.value ? 'sh-dot--active' : ''}`} />
          ))}
        </div>
        <div class="sh-onboarding-actions">
          <button class="sh-link" onClick={skip}>Skip</button>
          <Button onClick={next}>{isLast ? 'Get started' : 'Next'}</Button>
        </div>
      </div>
    </div>
  )
}
