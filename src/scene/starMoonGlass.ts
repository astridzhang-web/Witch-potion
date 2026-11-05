// Independently measured on the supplied 1024×1536 PNG (not the old 3B image).
export const STAR_MOON_GLASS = {
  src: '/assets/bottles/star-moon-glass.webp',
  width: 1024, height: 1536,
  mouth: { x: 512, y: 143 }, contactY: 1440,
  scale: 124 / (1440 - 143),
  // Inner aperture ≈x374–650; interior floor y1335, below the four-unit line y850.
  mouthRadius: 13.2, floorY: 1335, fullY: 850,
} as const
export const STAR_MOON_TRANSFORM = `translate(${50 - STAR_MOON_GLASS.mouth.x * STAR_MOON_GLASS.scale} ${10 - STAR_MOON_GLASS.mouth.y * STAR_MOON_GLASS.scale}) scale(${STAR_MOON_GLASS.scale})`
