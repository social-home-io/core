import { describe, it, expect } from 'vitest'
import { routes } from './router'

describe('router', () => {
  it('defines 27 routes', () => {
    // Routes added across recent passes:
    //   /dms/:id/calls   — per-conversation call history
    //   /calls/:callId   — in-call page
    //   /join            — space invite deep link (§23.62)
    //   /family          — parent dashboard (§CP)
    //   /feed            — explicit household-feed route (§23 dashboard)
    //   /spaces/:id/settings — admin space settings (§23 customization)
    //   /spaces/browse   — unified space browser (§D3)
    expect(Object.keys(routes).length).toBe(27)
  })

  it('has feed route at /', () => {
    expect(routes['/']).toBeTruthy()
  })

  it('has all main routes', () => {
    for (const path of ['/spaces', '/dms', '/calendar', '/shopping',
      '/notifications', '/tasks', '/pages', '/stickies', '/bazaar',
      '/settings', '/admin', '/connections',
      '/gallery', '/search', '/calls', '/family']) {
      expect(routes[path]).toBeTruthy()
    }
  })
})
