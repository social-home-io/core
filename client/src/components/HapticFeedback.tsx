/**
 * HapticFeedback — vibration feedback (§23.116).
 */
export function haptic(pattern: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  const ms = pattern === 'light' ? 10 : pattern === 'medium' ? 25 : 50
  navigator.vibrate(ms)
}
