import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('renders search input', () => {
    const { container } = render(<SearchBar />)
    const input = container.querySelector('.sh-search-input')
    expect(input).toBeTruthy()
  })

  it('has placeholder text', () => {
    const { container } = render(<SearchBar />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.placeholder).toContain('Search')
  })
})
