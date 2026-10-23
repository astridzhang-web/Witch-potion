# Locally hosted fonts

No font service, runtime request to a third party, or installable desktop font is shipped.
Both upstream fonts permit web embedding, modification and redistribution under **SIL OFL 1.1**.
The complete upstream copyright notices and license texts are adjacent to the WOFF2 files.
Our subsets retain copyright/license metadata and use the modified family names **Moonlit Display**
and **Moonlit Text** (including CFF names), avoiding upstream Reserved Font Names. These are
technical subset names; the glyph designs remain the requested fonts, not substitute typefaces.

| UI | Official source / release | Local subset | Size |
| --- | --- | --- | --- |
| Three cabinet labels, settlement title | [LXGW ZhenKai v0.800.2](https://github.com/lxgw/LxgwZhenKai/releases/tag/v0.800.2), `LXGWZhenKai-Regular.ttf` (internal version `0.800; June 8, 2025`) | `zhenkai-ui.woff2`, 11 characters | 5,960 B |
| HUD, prose, help, rewards | [Adobe Source Han Serif 2.003R](https://github.com/adobe-fonts/source-han-serif/tree/2.003R), `OTF/SimplifiedChinese/SourceHanSerifSC-Medium.otf` (internal version 2.003) | `han-serif-ui.woff2`, Medium, 328 characters | 119,416 B |

Total: **125,376 bytes / 122.4 KiB**. ZhenKai is the original regular edition requested here,
not the more recent Slab edition. No outlines or glyph advances were altered.

## Rebuild

Download these official, version-pinned inputs outside the repository:

- <https://github.com/lxgw/LxgwZhenKai/releases/download/v0.800.2/LXGWZhenKai-Regular.ttf>
  SHA-256 `a1fa086a6bdde475a3795cfa8d3b54cccd9ec60fe3ba3b8d4f45fd475dcbc954`
- <https://raw.githubusercontent.com/adobe-fonts/source-han-serif/2.003R/OTF/SimplifiedChinese/SourceHanSerifSC-Medium.otf>
  SHA-256 `1d4dc4b757c07034e2412d6edf48f54f94ec7172d4deb3b90a3e4fc9dcb94f5d`

Install Python `fonttools[woff]` in a temporary virtual environment, then:

```sh
python scripts/subset-fonts.py /path/to/LXGWZhenKai-Regular.ttf /path/to/SourceHanSerifSC-Medium.otf
```

The display subset contains exactly the fixed labels; the text subset covers ASCII and
non-ASCII characters found in application TS/TSX (excluding tests). New UI copy may require
regeneration; unsupported characters use the system fallback. Both files are preloaded,
use `font-display: swap`, and retain fixed control grids/line heights. CJK fallback chains
include Songti/SimSun for text and Kaiti for display. Existing Georgia numerals remain.
The single Medium text file is reused across UI weight declarations without synthetic bold.
