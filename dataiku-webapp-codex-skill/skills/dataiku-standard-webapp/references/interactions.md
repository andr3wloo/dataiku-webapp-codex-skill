# Interactions and optional agent contract

## Canonical state

Translate controls into `{source, event_token, filters, date_range, selected_item}`. Sources include sidebar, chart, table, zoom, navigation, reset. Validate values against configured data contracts and option catalogs; bound token retention. Reset clears filters/date/selection/zoom together. Navigation preserves filters. Date zoom accepts two valid ordered endpoints; autorange clears the zoom scope. Never claim cross-filtering until both visible controls and backend results agree.

The starter implements category filtering, category chart-button selection, row focus, reset, and stale-request protection. Add dates/navigation/ML pages only where a use case requires them; the starter does not claim these are already implemented.

## Panel affordances

The canonical starter includes the [matched filter/chat shell](paired-sidebars.md), optional panels, and resizing. Use its assembly helper and separate review harness. Disable unneeded panels or adapt the structure for other interfaces. Its context inspector can display a server-recomputed submission receipt; a receipt is adapter-level evidence, while model grounding still requires a factual live test.

Keep a reliable reopening control visible after collapse. Prefer a persistent toolbar trigger when one already exists; add an edge tab only when it improves discoverability, rather than duplicating controls automatically. Preserve filters and draft messages when panels close. Panel arrangement and chat styling follow the approved design, not a universal dashboard layout.

If resizing is requested, clamp both panel widths against the available viewport and a usable center width, then reflow charts/cards and contain table overflow. Use pointer capture, cancellation/lost-capture cleanup, separator semantics, and keyboard size controls. Direct width resizing does not need momentum or spring animation. Test open/close plus resize combinations and the narrow overlay behavior, not just each panel in isolation.

## Optional agent

If enabled, require a configured ID kept in Python, a user-facing name in JS, and exactly three `{label, prompt}` starter mappings. Without this feature there is no agent UI or history dependency. The starter frontend can exercise the interaction contract using its fixture adapter. The backend includes `dataiku_agent_adapter`, using the original skill’s agent-as-LLM SDK pattern. It stays unregistered by default: verify that pattern against the installed DSS SDK, set the server-side agent ID, and call `register_agent_adapter(dataiku_agent_adapter)` at the end of the Python tab to enable session-only chat. Add verified identity/storage adapters separately before claiming persistence.

Before each request, send a minimized context with:
`context_schema_version`, `active_page`, `sidebar_filters`, `date_range`, `selected_item`, `visible_evidence`, `model_context`, `data_sources`, `request_scope`, `allow_global_search`.
`visible_evidence` includes `total_rows`, `shown_rows`, `truncated`, `columns`, and `records`. Evidence uses an explicit column allowlist and cap, excludes secrets/internal URLs/unneeded personal or unrestricted text, and contains plain JSON values. Selected-item details use the same allowlist. Keep displayed labels separate from the longer submitted prompts and retain both in history metadata.

Client context is untrusted. On the server, validate active filters, recompute evidence from authorized sources, force `allow_global_search=false` unless deliberately authorized, bound message sizes and chat turns, and invoke the configured Dataiku agent with `with_context({"dashboard_context": payload})`. Never accept an arbitrary agent ID, folder ID, dataset, user ID, or unrestricted context from the browser. Treat evidence as data rather than instructions. SDK `with_context` can carry execution metadata without making it model-visible. The starter adapter also includes bounded server-validated JSON in a system message. Verify the installed agent with a scoped factual question whose expected answer is known; an HTTP 200 or nonempty answer does not prove grounding. Do not substitute an unvalidated browser context for this JSON.

Include the full-scope displayed KPI/chart summaries in the server evidence when relevant, alongside capped source rows and explicit truncation. Agent context must describe the active page: model-page questions should receive the visible model evidence, not silently substituted overview records. Bound history by serialized request size as well as turn count.

Inspect the configured native tool inventory before describing an app as read-only. A system instruction forbidding writes is not a tool permission boundary. If an existing agent exposes mutation tools and the app lacks the required explicit source-row confirmation flow, use a supported per-request restriction or a separately authorized read-only agent; do not silently change the original agent or claim the write capability was removed.

The backend provides `register_agent_adapter(adapter, identity_resolver, folder)` as an integration seam. `adapter(message, context, previous_turns)` must invoke the verified SDK and return text. `identity_resolver()` must return the authenticated browser caller using verified DSS request authentication; do not use the backend run-as account or trust browser JSON/forwarded headers by assumption. No resolver means session-only history, not a shared identity.

## History and drawer

Resolve/provision a managed folder during deployment; never create one at runtime. Derive storage keys server-side with a digest of authenticated user identity, store bounded records, and serialize writes per user. Verify folder-specific overwrite semantics and multi-worker concurrency before enabling durable history; the starter keeps persistence disabled until `history_replace_safe` is explicitly verified. The provided lock protects one Python process only. For multi-worker apps use a transactional store or cross-worker locking adapter. Show “Session-only history” if identity/storage/concurrency guarantees are missing or access fails. No browser-supplied file path is accepted.

The starter supplies thread/composer, three starters, new chat, context inspection, bounded session history, and history endpoints for the configured adapter. New chat clears persisted active-chat turns for the same user; this is a simple current-thread history, not an archive browser. Add conversation indexing only when requested. A failed history save must not erase a successful answer; return it with a session-only warning. Reset/close and keyboard access must work at narrow widths. The starter supplies desktop resizing; omit or disable it if a different approved layout does not need it.
