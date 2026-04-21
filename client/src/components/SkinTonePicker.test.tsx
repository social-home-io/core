import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import { SkinTonePicker, selectedTone, applyTone } from './SkinTonePicker'

describe('SkinTonePicker', () => {
  beforeEach(() => {
    selectedTone.value = ''
    localStorage.clear()
  })

  it('renders 6 tone options', () => {
    const { container } = render(<SkinTonePicker />)
    const buttons = container.querySelectorAll('.sh-skin-btn')
    expect(buttons.length).toBe(6)
  })

  it('selects a tone on click', () => {
    const { container } = render(<SkinTonePicker />)
    const buttons = container.querySelectorAll('.sh-skin-btn')
    fireEvent.click(buttons[2]) // medium tone
    expect(selectedTone.value).not.toBe('')
  })
})

describe('applyTone', () => {
  it('returns emoji unchanged when no tone selected', () => {
    selectedTone.value = ''
    expect(applyTone('👋')).toBe('👋')
  })

  it('appends modifier when tone selected', () => {
    selectedTone.value = '🏽'
    expect(applyTone('👋')).toBe('👋🏽')
  })
})
