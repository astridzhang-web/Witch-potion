# Milestone 2B contact-shadow correction — browser comparison

All images show the first preset in its original color order, with color symbols off. The resting captures use the same **390×844 CSS viewport and zero-move board** as the prior Milestone 2B screenshot. Before captures were taken from `22a4454` before any code edits; after captures come from the verified production build.

The enlarged details are direct browser screenshot clips rendered at **deviceScaleFactor=3** while retaining the 390×844 CSS viewport. They have not been composited, repainted or scaled in an image editor. Both versions use the same source-image clip regions: x=100–740, top row y=410–710, bottom row y=1240–1540, mapped into the actual scene's screen coordinates.

| View | Before | After |
| --- | --- | --- |
| Full page, 390×844 | [Milestone 2B baseline](milestone2b-tall-390x844.png) | [Corrected full page](milestone2b-contact-after-390x844.png) |
| Top row + shelf | [Before, 3× browser detail](milestone2b-contact-before-top-detail.png) | [After, 3× browser detail](milestone2b-contact-after-top-detail.png) |
| Bottom row, full and empty bottles | [Before, 3× browser detail](milestone2b-contact-before-lower-detail.png) | [After, 3× browser detail](milestone2b-contact-after-lower-detail.png) |
| Pouring bottle 1 → 8, 390×844 | [Previous pouring frame](milestone2b-tall-pour-390x844.png) | [Corrected pouring frame](milestone2b-contact-pour-390x844.png) |

[Selected source, before flight](milestone2b-contact-selected-390x844.png) additionally shows the existing 5px lift and the dimmed shadow remaining on the shelf. The pouring frame uses a frozen browser animation clock 430ms into the move, with a fixed viewport screenshot; no full-page resize occurs during flight.

The old flat ellipse sat below the true base and amplified the separation against the warm wood lighting. The new shadow is smaller, soft and centered on the glass contact point. The source's stationary shadow disappears during flight, the receiving bottle retains its shadow, and the flying SVG has no shelf-contact ellipse. The shelf's original orange/gold illumination remains unchanged.

Visual review found the top row's existing glass positions within the measured support plane and clear of the side posts. All bottle coordinates and sizes were retained; this correction changes only contact-shadow presentation and its selection/flight visibility.
