/**
 * ErrorBoundary — catch render errors (§23.5).
 * Shows a fallback UI instead of crashing the entire app.
 */
import { Component } from 'preact'
import type { ComponentChildren } from 'preact'
import { Button } from './Button'

interface Props {
  children: ComponentChildren
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div class="sh-error-state">
          <h2>Something went wrong</h2>
          <p class="sh-muted">{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
