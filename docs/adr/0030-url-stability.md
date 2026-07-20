# ADR-0030: URL Stability

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

The recommendation to rename "pages" to "Studios" raised the question of whether URLs should change to match the new naming convention (e.g., `/studio/reality`, `/studio/decision`).

## Decision

Do not rename routes yet.

- Rename the **UI language**, not the routing layer.
- Keep current URLs: `/`, `/command`, `/decisions`, `/intelligence`, `/navigate`, `/settings`
- Change visible titles to use "Studio" naming:
  - `/` → **Reality Studio**
  - `/decisions` → **Decision Studio**
  - `/command` → **Command Studio**
  - `/intelligence` → **Intelligence Studio**

**Why?** URLs are part of the external API. Names are branding. Branding changes more frequently than APIs.

When the plugin router is introduced in a future version, migrate to:

```
/studio/reality
/studio/decision
/studio/execution
```

using redirects without breaking existing links.

## Consequences

- Current route paths are frozen until v0.3.
- All visible UI labels now use "Studio" terminology.
- Route restructuring is deferred to a dedicated URL migration sprint.
- Redirects will be implemented when routes change.
