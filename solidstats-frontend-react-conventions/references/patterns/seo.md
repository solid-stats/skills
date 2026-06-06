# Rendering & SEO

SEO is the #3 quality priority (after UX continuity and accessibility). Public stat surfaces are a
public product — they must be indexable and fast.

## Server rendering

- SEO-critical public pages return **meaningful server-rendered HTML before client JS** (TanStack Start
  SSR). Public **detail** pages (player/squad/rotation/commander/bounty/replay) are renderable and
  indexable without client-only fetching — their content is prefetched in the loader (see
  `data-flow.md`).
- Use SSR / streaming / SSG / ISR-style regeneration per data freshness; replay pages SSR summary +
  participant context first, then load timeline/events progressively for good LCP.

## Metadata

- Each indexable page has a **unique title and meta description**, and a **canonical** URL.
- **`/ru` `/en`** pages emit canonical + **hreflang** for the locale pair.
- Structured data where content supports it: **`VideoGame`**, **`BreadcrumbList`**, **`ItemList`**.
- Descriptive link text (no generic "read more").

## Sitemaps & crawl control

- Provide **sitemap + robots**. Large URL sets (especially replay pages) use a **segmented sitemap
  index**.
- **No crawl traps** from volatile filter/search/sort/cursor URLs: expose **curated indexable** filter/
  category URLs, and apply explicit **`noindex`/canonical** to volatile states. Arbitrary
  search/sort/cursor combinations must not be indexable.

## Indexable v1 surface

Overview, player/squad lists, player/squad profiles, rotation pages, commander pages, bounty pages,
and **all** replay detail pages. Pages must not depend on authenticated data for public rendering.

Review flags:

- An indexable page whose main content is client-only fetched (not in SSR HTML).
- Missing/duplicate title or meta description; missing canonical; missing `/ru` `/en` hreflang.
- A volatile filter/sort/cursor URL left indexable (crawl trap) instead of `noindex`/canonical.
- Replay pages not covered by a segmented sitemap index.
- Public page rendering gated on authenticated data.
