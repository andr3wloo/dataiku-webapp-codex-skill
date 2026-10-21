# Progressive loading and navigation performance

Optimize for the first useful screen and the next likely action, not just for a fast API response. Use this guidance when the user reports slow startup/navigation or when the app serves large datasets across multiple pages. First inspect the existing request graph, dataset sizes, browser waterfall, and backend logs so optimization targets measured bottlenecks.

## Stage work around the first useful view

- Render the app shell, navigation, and loading placeholders immediately. Keep the first request limited to data needed to make the initial view useful, such as a bounded alert rollup, filter values, and source freshness. Avoid making the initial route wait for full historical scans or unrelated pages.
- Defer expensive but needed summaries to a separate request when they are not required to interpret the initial view. If a KPI is shown, calculate it over the full filtered population; never use a display cap or sample as its denominator. Show a clear loading, partial, retry, or unavailable state until the correct result arrives.
- After the first useful view has rendered, warm likely secondary pages in the background when measurements or user needs justify it. Use a queue with bounded concurrency (start with one or two requests, then tune from observed backend capacity). Do not issue an unbounded `Promise.all` over every page or compete with the critical initial request. Keep expensive, rarely visited, user-specific, or interaction-only resources on demand.
- On very large sources, move stable reusable joins and aggregations into the Flow. For request-time work, project only needed columns, apply scope filters early, stream rows in chunks, and avoid deriving IDs or materializing full records before filtering. Send capped display rows plus full-scope aggregates and explicit truncation metadata.

## Cache and request correctness

- Deduplicate identical in-flight reads. Use a bounded route cache with explicit freshness/invalidation behavior; include the route, canonical filters, relevant parameters, and effective data version or source freshness in its key. Keep user-specific results isolated and do not create a global cache across users.
- Invalidate or naturally miss cache entries when a relevant filter, date range, source version, or refresh changes. Make cache size/TTL reflect payload size and data freshness rather than keeping unbounded responses in browser memory.
- Support cancellation where possible and always guard responses with a request generation/token so a slow obsolete request cannot replace newer filter results. A failure in a background prefetch must not break the current page; show a retry state when the user navigates to data that failed to warm.
- Keep canonical filter state shared by the initial route and background requests. Do not let prefetched results from one scope appear under another scope.

## Measure and verify

- Instrument browser milestones for navigation start, first useful content, and completion of deferred summaries. Measure each route request separately. Use browser performance entries or an equivalent browser measurement for paint/content milestones; use server logs for backend work. A server 200 time is not browser first paint.
- Compare cold first visits with warm navigation after prefetch. Use representative data, normal DSS iframe behavior, and realistic network/backend load. Record which routes were in flight, payload sizes, errors, and whether the initial interaction remained responsive.
- Verify that the first page shows useful content before deferred work finishes; full-scope KPIs reconcile; background requests respect the concurrency limit; warmed and cold secondary routes both work; filters/reset invalidate or select the right cache entries; failures can retry; and stale responses never repaint the page.
- Report local fixture timing separately from live browser timing. State whether a number is browser-observed, request timing, or server-log timing, and avoid claiming end-to-end improvement when only one layer was measured.
