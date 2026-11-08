# Embedded classroom browser compatibility

The 2026-11-08 viewport patch fixes a startup layout defect in embedded browsers
that do not recognise dynamic viewport units. The inspected local ClassIn build
contains Chromium 103; `dvh` is supported from Chromium 108.

Each lesson now declares `height:100vh` before `height:100dvh`. Older engines keep
the supported height instead of collapsing the percentage-sized viewport and
scaling the lesson to zero. Modern browsers still use the dynamic height.

A small classic-script bootstrap preserves native ResizeObserver when present,
provides a size-change fallback when absent, and shows an English reload message
if startup fails. The original teaching scripts, lesson data, image/video/audio
payloads and existing audio-unlock handler are unchanged.

The repository still uses the original lesson URLs. No browser data is cleared.
Reload the lesson after deployment; a query such as `?compat=20261108` can avoid
an old cached document without changing the lesson itself.

Validation: six automated checks cover bootstrap readiness, the timeout state,
observer changes and disconnection, screen CSS fallback, and unchanged original
teaching/media script hashes in all three HTML files. ClassIn classroom visual
retesting was not completed because local Computer Use was stopped by Escape.
