import { describe, it, expect, vi, beforeAll } from 'vitest'

// jsdom doesn't ship ResizeObserver; LocationMap uses it to
// invalidate Leaflet's size when a hidden tab becomes visible.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

// Leaflet manipulates the DOM directly which is heavy under jsdom.
// The smoke test only validates the module contract: exports a
// component, renders a container, and handles the empty state.
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      remove: vi.fn(),
      invalidateSize: vi.fn(),
      setView: vi.fn(),
      fitBounds: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => ({ addTo: vi.fn(), clearLayers: vi.fn() })),
    marker: vi.fn(() => ({ addTo: vi.fn(), bindPopup: vi.fn() })),
    circle: vi.fn(() => ({ addTo: vi.fn() })),
    divIcon: vi.fn(),
    latLngBounds: vi.fn(() => ({ pad: vi.fn(() => ({})) })),
  },
}))

describe('LocationMap', () => {
  it('module exports a LocationMap component', async () => {
    const mod = await import('./LocationMap')
    expect(mod.LocationMap).toBeTruthy()
    expect(typeof mod.LocationMap).toBe('function')
  })

  it('shows the empty-label pane when no markers are provided', async () => {
    const { render } = await import('@testing-library/preact')
    const { LocationMap } = await import('./LocationMap')
    const { getByText } = render(
      <LocationMap markers={[]} emptyLabel="Nothing here yet." />,
    )
    expect(getByText('Nothing here yet.')).toBeTruthy()
  })
})
