import { describe, it, expect } from 'vitest'
import { ws } from './ws'

describe('ws', () => {
  it('exports a WsManager instance', () => {
    expect(ws).toBeTruthy()
    expect(typeof ws.on).toBe('function')
    expect(typeof ws.send).toBe('function')
  })
})
