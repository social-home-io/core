/**
 * OptimisticUI — update local state before API confirms (§23.117).
 * Utility for wrapping API calls with immediate UI feedback.
 */
import { showToast } from './Toast'

/**
 * Run an optimistic mutation: apply locally first, then await API.
 * On failure, call rollback and show error toast.
 */
export async function optimistic<T>(
  applyLocal: () => T,
  apiCall: () => Promise<void>,
  rollback: (prev: T) => void,
): Promise<void> {
  const prev = applyLocal()
  try {
    await apiCall()
  } catch (e: any) {
    rollback(prev)
    showToast(e.message || 'Action failed — reverted', 'error')
  }
}
