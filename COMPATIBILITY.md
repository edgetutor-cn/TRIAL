# Fast embedded classroom lessons — 2026-11-09

The first viewport fallback addressed a real compatibility defect but did not
resolve the reported ClassIn startup failure. Release `r20261109a` replaces the
multi-megabyte inline/module pages with approximately 5 KB HTML shells, a shared
classic-script runtime targeting Chrome 69 / Safari 12, and separate media.

Images are resized for the actual lesson canvas. Fonts are subset WOFF2 files.
Songs use `preload="none"` and are requested only after Play. The user-supplied
Goodbye video remains byte-identical. Media range requests return HTTP 206.

The `100vh` / `100dvh` fallback is retained. A late successful mount now removes
the loading overlay even after a slow connection; the old 30-second timeout no
longer leaves a successful lesson covered. Saved records are validated without
clearing valid records, and render errors provide an English recovery screen.

The user confirmed that My Body displays its cover and the Let’s begin button
works in an empty ClassIn test classroom. Browser checks covered all 76 pages
with no observed broken images. Memory, optional entry/exit, reward audio and
Goodbye playback were exercised. Ten automated checks passed. This does not
claim that every interaction was retested in every ClassIn version or network.

The original lesson URLs remain in place. Reload an old open page, or use
`my-body.html?fast=r20261109a` to bypass its old cached document. Keep the entire
runtime/assets/fonts/media folders together when republishing elsewhere.
