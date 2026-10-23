import { expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CrystalDisplay from './CrystalDisplay'

it('reserves a three-crystal art layout without introducing a third reward condition', () => {
  const markup = renderToStaticMarkup(createElement(CrystalDisplay, { count: 3 }))
  expect(markup).toContain('data-count="3"')
  expect(markup.match(/class="reward-crystal"/g)).toHaveLength(3)
  expect(markup.match(/class="astrolabe"/g)).toHaveLength(1)
})
