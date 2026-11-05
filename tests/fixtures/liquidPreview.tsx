// Browser-only visual fixture, loaded explicitly by screenshot tools through Vite dev.
// Mounts the real BottleArt at slot 0; never changes the running game's save/board.
import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import { BottleArt } from '../../src/components/Bottle'
import type { Bottle } from '../../src/game/rules'
import { restGlassPose } from '../../src/scene/glassLighting'
const roots = new Map<number, Root>()
export function renderLiquidFixture(liquid: Bottle, index = 0) {
  let root = roots.get(index)
  if (!root) {
    const slot = document.querySelector(`[data-testid="bottle-${index}"]`)!
    slot.querySelector('svg.bottle-art')!.remove()
    const host = document.createElement('span')
    host.style.display = 'contents'
    host.dataset.liquidFixture = 'true'
    slot.append(host)
    root = createRoot(host)
    roots.set(index, root)
    // Screenshot context only: prevent the display fixture being mistaken for play state.
    document.querySelector('main')?.setAttribute('inert', '')
  }
  root.render(createElement(BottleArt, { liquid, kind: 'moon-glass', glassPose: restGlassPose(index) }))
}
