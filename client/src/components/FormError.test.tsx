import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { FormError } from './FormError'

describe('FormError', () => {
  it('renders nothing when message is empty', () => {
    const { container } = render(<FormError id="x" message={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders role="alert" with the message and wireable id', () => {
    const { getByRole } = render(<FormError id="login-err" message="Nope" />)
    const alert = getByRole('alert')
    expect(alert).not.toBeNull()
    expect(alert.textContent).toBe('Nope')
    expect(alert.id).toBe('login-err')
  })
})
