# Impeccable design workflow for Dataiku Standard WebApps

Local, task-specific adaptation of the user-supplied `impeccable:impeccable` skill, version **4.3.1**, reviewed **2026-10-19**. Source resources: `SKILL.md`, `reference/operate.md`, `reference/craft-floor.md`, and the web design/review playbooks. This is maintained local guidance, not the upstream plugin runtime or a verbatim mirror. Source snapshot hashes are in [impeccable-source.json](impeccable-source.json). These notes support routine craft without an upstream lookup; they do not execute the Impeccable plugin or replace the user-triggered Impeccable workflow below.

Read for frontend work. Keep Dataiku architecture, data contracts, deployment authorization, approved preview, and [QA](qa.md) requirements in force. For loading work, use [progressive loading](performance.md); for direct manipulation, use the detailed [design reference](design.md).

## Choose the scope and visitor mode

Inspect the incumbent app, supplied screenshots, real copy/data, tokens, components, and existing product/design notes. Verify that a screenshot actually represents the current source. Missing design documentation does not erase an established identity or turn a patch into a redesign. Reuse known audience, task, brand, and approval; ask only for unresolved choices that materially affect the result.

- **Operate** is the normal Dataiku dashboard/tool mode. Optimize the user's task, scanning, filtering, investigation, and recovery. Familiar controls and appropriate density are strengths; expression belongs in precise brand details.
- **Read** suits definitions, methodology, reports, and help. Prioritize prose hierarchy, reading measure, and wayfinding.
- **Persuade** suits an explicitly requested landing/onboarding surface. Lead with truthful value and evidence, then one clear action.
- **Experience** suits an explicitly requested exploratory or presentation surface. Let its subject lead while retaining usable navigation and accessibility.

For a refinement, preserve the incumbent identity, factual content, and unrelated behavior. For an authorized redesign, preserve product truth and confirmed brand constraints while deliberately choosing the replacement visual system. Extend an existing component within its current system. Explore alternatives only when the new direction is genuinely open; a precise screenshot/template request does not need a concept tournament. Keep durable design notes when useful for sustained work, without making new metadata files a prerequisite for a small patch.

## Operational design defaults

**Hierarchy and density.** Start from the decision and next useful action. Establish one dominant page heading and a consistent supporting hierarchy. Group related controls tightly and separate independent sections. Use a spacing scale, common baselines, and shared component tokens. Prefer a meaningful section/table to a stack of interchangeable cards. Use cards when they communicate real grouping, not as a container around every element. Allow dense evidence tables when users need them; contain their overflow rather than shrinking all text.

**Typography.** A well-tuned system sans family is a good default for a Dataiku tool. Use stable rem sizes and a modest type scale for operational headings, controls, and data. Choose weight, line height, tracking, and alignment together. Keep long explanatory prose around 65–75 characters per line where practical; tables can be wider. Use tabular numerals for comparable values and align numeric columns. Test long names, negatives, large values, text growth, fallback fonts, and narrow panels. Do not add remote fonts or a display face merely to make a dashboard appear designed.

**Color and surfaces.** Use a restrained palette with distinct text, surface, border, focus, accent, and semantic roles. Accent should identify primary actions, selection, or meaningful data. Keep category colors stable across pages and filters. Establish hover, focus, active, disabled, selected, loading, warning, error, and success states. Contrast, units, status words, and chart symbols must carry meaning beyond hue. Give panels/toolbars a deliberate neutral surface without decorative gradients or glass that weaken data legibility.

**Components and affordances.** Use one vocabulary for buttons, filters, icons, tabs, tables, and overlays. Use a coherent SVG/icon set for new controls; preserve an approved incumbent when a narrow task does not authorize replacing it. Prefer native controls and familiar navigation. Default to inline/progressive interaction where interruption is unnecessary. Keep popovers/dropdowns clear of clipping scroll containers; use supported browser primitives or appropriate layering. Theme selection, focus, caret, and data numerals consistently where useful, while retaining recognizable platform affordances.

**Copy and states.** Controls name their action. Errors name the problem and a practical recovery; empty states distinguish an empty scope from a missing/unbuilt source. Show immediate acknowledgment, meaningful loading feedback, retry, and retained input. Reserve space for deferred content to avoid layout jumps. Skeletons suit known content structure; a concise status suits a small operation. Never invent a KPI, claim, source timestamp, or production-readiness assertion to make the layout look complete.

**Responsive structure.** Adapt the composition rather than only scaling type: reflow columns, collapse appropriate navigation, and contain necessary two-dimensional tables. At narrow widths preserve the consumer's main task and context. Check touch, keyboard, text resize, and iframe widths with long realistic content. The [paired-sidebars template](paired-sidebars.md) supplies matched desktop panels and one modal panel at a time on narrow screens; retain its reset, focus, resize, and context contracts when adapting it.

**Motion.** Motion communicates state or direct manipulation. Simple operational transitions are usually brief (roughly 150–250 ms when appropriate), reversible, and never block input or data loading. Do not add page-load choreography to a task dashboard. Gesture-driven movement follows the Apple-derived position/velocity/interruptibility guidance, rather than a fixed-duration transition. Test reduced motion, transparency, contrast, and actual rendering cost in DSS. An expensive visual effect is optional; responsive input is essential.

## Route common requests to an observable result

These are capabilities to apply within the Dataiku workflow, not commands that require a separate executable.

| User intent | Apply locally | Completion evidence |
| --- | --- | --- |
| Shape/build/redesign | Resolve task, hierarchy, content, constraints, interaction, and visual authority; create the approved concrete preview | Rendered main path and meaningful states match the chosen direction |
| Critique | Assess clarity, hierarchy, cognitive load, navigation, and trust against the consumer's task | Prioritized findings with a location, consequence, and concrete fix |
| Audit | Inspect accessibility, state coverage, responsive layout, performance, and unsafe/fragile UI behavior | Findings distinguish measured failures from risks and checks not run; audit alone does not authorize a rewrite |
| Polish/layout/typeset | Correct alignment, rhythm, scale, density, truncation, and component inconsistency within the approved system | Before/after comparison with real content and affected breakpoints |
| Clarify/onboard | Improve action labels, help, empty/error states, and progressive disclosure using product truth | User can find the next action and recover without development commentary |
| Distill/quieter | Remove competing emphasis, redundant chrome, and unnecessary interaction; preserve useful data and wayfinding | Fewer competing elements with the same required capabilities |
| Bolder/colorize/delight | Make deliberate improvements in hierarchy, palette use, or meaningful feedback within the authorized brand/direction | The change improves the intended task or requested expressive goal; no invented claims |
| Animate | Add purposeful, interruptible state feedback with keyboard and reduced-motion alternatives | Reversal, cancellation, focus, and performance behave correctly |
| Adapt/harden | Cover long/missing/invalid content, text growth, narrow widths, locale formatting, failed/slow requests, and concurrent actions | Layout remains usable, drafts survive failures, and stale/duplicate responses cannot corrupt state |
| Optimize | Measure the bottleneck, stage initial data, bound background work and cache, reduce unnecessary rendering | Browser time-to-usable and endpoint timing are reported separately; correctness remains intact |
| Extract/document | Capture repeated tokens/components and confirmed design decisions from actual source/evidence | Reusable assets and notes describe current behavior rather than guessed standards |
| Live variants/overdrive | Use only for a specifically requested visual exploration; keep experiments outside the canonical candidate until selected | A concrete reviewed variant and clear selection before integration |

## Reconcile this guidance with the existing skill

The user's brief, confirmed branding, chosen template, and explicit task scope govern aesthetic choices. This adaptation does not import upstream blanket aesthetic bans that would silently remove approved KPI cards, scope labels, borders, radii, or system fonts from the supplied dashboard. Review those elements for usefulness and consistency instead. Likewise, do not require custom scrollbars, external fonts, decorative motion, a new visual identity, or framework/tooling changes just to satisfy a style preference.

The local Apple-derived reference handles detailed interaction physics. Impeccable contributes the broader task/design workflow and operational craft. Neither changes KPI denominators, client/server trust boundaries, per-user history isolation, or authorization for a live Dataiku target.

## Bounded visual review

Build the complete scoped change, then inspect desktop and narrow layouts plus relevant states together in one evidence-gathering round. Batch the demonstrated fixes, then use one confirmation round. Stop discretionary polishing after that; record unresolved issues honestly. Required functional, accessibility, security, or live-integration failures must still be resolved or reported as incomplete, rather than hidden by a visual-review limit.

Check built results rather than intentions: grouping/alignment, real copy, focus/contrast, state feedback, overflow/clipping, brand consistency, supported gestures, data truth, and all requested controls. Reuse [design review](design-review.md) and [QA](qa.md) as the single approval/acceptance workflow rather than adding another approval cycle.

## Recommend Impeccable and let it route the work

For a new design or meaningful visual refinement, recommend critique and polish as useful starting points, while inviting the user to let Impeccable recommend the best workflow. For example: “I recommend using Impeccable to assess and refine this preview. Critique and polish may help; trigger `$impeccable` with this URL/revision and ask what it recommends.” Reuse an invocation already given. Do not impose critique → polish, require every command, or restrict the user to those two capabilities.

Delegate command selection to the installed Impeccable routing guidance and current evidence. It may recommend audit, layout, typeset, clarify, adapt, harden, optimize, or another relevant workflow. Honor an explicit user choice. A recommendation/menu is not itself permission to execute a command: follow Impeccable’s selection rules and existing task authorization, without requesting another trigger for steps the user already authorized. Do not broaden into an unrelated redesign, tooling setup, or live Dataiku mutation.

Supply the consumer task, live preview URL/revision, canonical sources, and desktop/narrow states. Keep the local preview available, apply authorized recommendations locally, and obtain approval of the resulting revision before Dataiku writes. Impeccable review/refinement is not preview/deployment approval. If the user declines or the plugin is unavailable, disclose that and continue the local acceptance review; do not install it automatically or describe these notes as executed plugin work.

When the user triggers the installed Impeccable skill for a UI task, read that installed skill and use its discovered skill-base path. Its context loader and playbooks belong to that invocation; do not hardcode a plugin cache path into generated apps or this portable skill. Respect its documented fallback if its launcher is unavailable. The local adaptation remains usable on another harness without the plugin.

Hooks, pinning, doctor/drift repair, downloaded binaries, concept generators, and native iOS/Android tooling are not bundled or enabled by this integration. Use those capabilities only when requested through the full plugin, within the user's existing permissions. Reading or maintaining this integration is not a UI task and does not by itself require running the Impeccable launcher.
