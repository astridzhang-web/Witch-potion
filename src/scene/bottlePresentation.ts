// Internal historical comparison; default is one shared formal configuration for all slots.
export const BOTTLE_PRESENTATION = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('bottles') === 'sample' ? 'sample' : 'uniform'
export const usesFormalBottle = (index: number) => BOTTLE_PRESENTATION === 'uniform' || index === 0
export const bottleVisualScale = (index: number) => usesFormalBottle(index) ? 1.13 : 1
