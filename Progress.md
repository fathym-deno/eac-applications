Here’s a pragmatic plan to enable “cloud EaC” refresh without restarts, with a
path to eventing later.

Approach Summary

Add a refresh orchestration layer that can rebuild the runtime with a new merged
EaC and hot‑swap it atomically. Provide multiple triggers (manual IoC method,
protected admin endpoint, optional polling) using change detection (ETag/hash)
to avoid unnecessary rebuilds. Keep the design compatible with a future
event-driven signal. Key Components

EaCSource: fetches “cloud” EaC, merges with local baseline, tracks
version/ETag/hash. RuntimeBuilder: pure function to build a new runtime
(plugins, routes, resolvers) from an EaC snapshot. RuntimeHost (Hot‑Swappable):
holds the current handler/runtime and supports atomic swap to a newly built
instance. EaCRefreshController: orchestrates refresh: detect change → build new
runtime → readiness checks → atomic swap → dispose old. Triggering a Refresh

IoC method: FathymEaCPlugin registers a method (e.g., requestEaCRefresh()), but
it only signals the controller; it does not rebuild itself. Admin endpoint:
protected POST /_internal/eac/refresh that calls the IoC method for operational
control. Polling (interim): optional background interval with jitter that
performs a conditional fetch via ETag/If‑None‑Match to detect changes cheaply.
Backpressure: rate‑limit, dedupe, and lock to prevent overlapping rebuilds.
Atomic Rebuild + Swap

Build in isolation: RuntimeBuilder constructs an entirely new app graph from the
fresh EaC (same lifecycle as startup). Health/readiness: optionally run a quick
readiness check on the new runtime (e.g., validate critical routes/middleware
init). Swap: RuntimeHost.swap(newRuntime) replaces the handler atomically;
in‑flight requests complete on the old handler. Dispose: gracefully tear down
the old runtime after a short drain window. Change Detection

Prefer server-provided signals: ETag/Last‑Modified from the “cloud” EaC service.
Fallback: compute a stable hash of the merged EaC to determine material changes.
Only rebuild on change to avoid churn. Safety, Concurrency, Observability

Single-flight lock: drop or queue duplicate refresh requests while one is
running. Cooldown: configurable minimum time between successful swaps. Failure
handling: on fetch/build failure, retain current runtime and log metrics;
optional exponential backoff for retries. Metrics/logging: record fetch latency,
ETag hits, rebuild duration, swap count, failures. Security

Protect the admin endpoint via OAuth/role checks or a shared secret header.
Ensure IoC-exposed refresh is not publicly reachable. Integration Points (no
code yet)

src/runtime/plugins/FathymEaCPlugin.ts: register EaCSource +
EaCRefreshController into IoC; expose requestEaCRefresh.
src/runtime/plugins/FathymEaCApplicationsPlugin.ts: ensure it builds cleanly
from a provided EaC and is safe to rebuild. src/runtime/processors/.deps.ts and
related resolvers: confirm they don’t keep static singletons tied to an old EaC;
rely on the rebuilt container. oauth components (e.g.,
src/runtime/modules/oauth/oauthMiddleware.ts): ensure they are rebuilt and
re-registered from the new container. Config Toggles

EAC_REFRESH_POLL_INTERVAL_MS, EAC_REFRESH_MAX_FREQUENCY_MS
EAC_REFRESH_ENDPOINT_TOKEN (or role requirement) EAC_REFRESH_BACKOFF_MS,
EAC_REFRESH_DRAIN_MS Rollout Plan

Phase 1: Introduce RuntimeHost hot‑swap and RuntimeBuilder; add manual IoC
method and protected endpoint. Phase 2: Add optional polling with conditional
requests; enable metrics/alerts. Phase 3: Replace polling with event‑driven
notifications from the “cloud” service. Alternative (Longer‑term Refactor)

Live‑bound configuration: refactor resolvers/middleware to read from a central
EaCAccessor on each request, enabling configuration updates without full
rebuilds. Lower swap cost but higher integration touch; good target after
initial hot‑swap solution. If you want, I can sketch the minimal interfaces for
EaCSource, RuntimeBuilder, RuntimeHost, and the controller next so
implementation slots cleanly into your plugin lifecycle.

# Cloud EaC Refresh – Plan (Repo‑Local)

This repo contains both the consumer of cloud EaC and the cloud runtime plugins
themselves, so we can implement the full refresh mechanism here without external
changes. Concretely: `FathymEaCPlugin` (loads cloud EaC from the Steward
service) and the Steward plugins (`EaCStewardAPIPlugin`, `EaCStewardPlugin`)
live here, along with the applications runtime (`FathymEaCApplicationsPlugin`).

## Objectives

- Hot‑refresh cloud EaC at runtime, no process restart.
- Rebuild the runtime graph from a fresh EaC snapshot and atomically swap
  handlers.
- Provide manual trigger now; keep design compatible with polling and future
  eventing.

## Core Pieces

- EaCSource: encapsulates fetch + merge of cloud EaC (via `loadEaCStewardSvc`),
  tracks ETag/hash for change detection.
- RuntimeBuilder: pure build of the runtime (plugins, routes, resolvers) from an
  EaC snapshot; mirrors startup path.
- RuntimeHost: hot‑swappable holder of the current `EaCRuntimeHandler`; supports
  atomic `swap` and graceful drain of the old instance.
- EaCRefreshController: orchestrates refresh (change detect → build → readiness
  check → swap → dispose), with locking and backoff.

## Why This Repo Is Sufficient

- Cloud fetcher exists in `src/runtime/plugins/FathymEaCPlugin.ts` (uses JWT +
  `loadEaCStewardSvc`).
- Route/handler assembly is in
  `src/runtime/plugins/FathymEaCApplicationsPlugin.ts` and friends, which
  already builds routes from EaC. Rebuilding this plugin with a new EaC yields a
  new handler graph.
- The Steward runtime plugins (`EaCStewardAPIPlugin`, `EaCStewardPlugin`) are
  part of this repo’s published packages; we can wire a protected refresh
  endpoint using the same plugin stack or a minimal internal app.

## Triggers (Short‑Term)

- IoC method: register `requestEaCRefresh()` in the container (exposed by
  `FathymEaCPlugin`). It signals the controller; it does not rebuild inline.
- Admin endpoint: `POST /_internal/eac/refresh` protected by OAuth/role or
  shared secret header; handler resolves and calls the IoC method.
- Optional polling: background interval (with jitter) that performs a
  conditional fetch (ETag/If‑None‑Match); only rebuild on change.

## Atomic Rebuild + Swap

- Isolated build: `RuntimeBuilder` reconstructs the entire runtime using the
  same plugin lifecycle (Setup → AfterEaCResolved) against the new EaC.
- Readiness probe: minimally validate critical middleware/route wiring (e.g.,
  instantiate a no‑op request through the pipeline or validate resolver tables)
  before swap.
- Swap: `RuntimeHost.swap(newHandler)` atomically updates the handler; in‑flight
  requests finish on the old handler.
- Drain/Dispose: configurable drain window, then dispose old instance (timers,
  caches, ioc singletons).

## Change Detection

- Prefer Steward ETag/Last‑Modified if available; otherwise compute a stable
  hash of the fetched/merged EaC JSON.
- Dedupe: single‑flight lock to prevent concurrent rebuilds; cooldown between
  successful swaps.

## Security & Ops

- Admin endpoint requires OAuth role or secret header; audit log refresh
  requests.
- Metrics: fetch latency, ETag hits, build duration, swap count, failures; log
  structured events via `LoggingProvider`.

## Integration Points (Files)

- `src/runtime/plugins/FathymEaCPlugin.ts`:
  - Register `EaCSource`, `EaCRefreshController`, and `RuntimeHost` into IoC at
    Setup.
  - Expose `requestEaCRefresh()` IoC method.
  - Optionally start polling (config‑driven, off by default).

- `src/runtime/plugins/FathymEaCApplicationsPlugin.ts`:
  - Ensure route graph builds are purely derived from the provided EaC and IoC;
    no static singletons that would outlive a swap.
  - Avoid caching handlers across EaC versions; bind any caches to the current
    runtime instance.

- Steward plugins (`EaCStewardAPIPlugin`, `EaCStewardPlugin`):
  - Add a protected internal admin route to trigger refresh (or create a tiny
    internal application/processor here to do so) that calls the IoC method.

- OAuth/resolvers: verify they resolve from IoC on each build so new config
  applies post‑swap.

## Config Toggles (env)

- `EAC_REFRESH_POLL_INTERVAL_MS` (0 disables polling),
  `EAC_REFRESH_MIN_INTERVAL_MS`
- `EAC_REFRESH_ENDPOINT_TOKEN` or required role for admin endpoint
- `EAC_REFRESH_BUILD_TIMEOUT_MS`, `EAC_REFRESH_DRAIN_MS`,
  `EAC_REFRESH_BACKOFF_MS`

## Rollout Plan

1. Manual Refresh (MVP)

- Implement `RuntimeHost`, `RuntimeBuilder`, `EaCSource`,
  `EaCRefreshController`.
- Expose IoC `requestEaCRefresh()`; add protected admin endpoint using existing
  plugin stack.
- Validate swap under load locally (requests in flight complete, new routes
  appear).

2. Optional Polling

- Add conditional fetch (ETag) to `EaCSource`; enable interval + jitter; enforce
  single‑flight and cooldown.
- Add metrics and structured logs.

3. Event‑Driven

- Replace polling with steward change notifications when available; wire handler
  to call `requestEaCRefresh()`.

## Risks / Mitigations

- Hidden singletons: audit processors/modifiers for static state; tie lifetime
  to IoC scope so they rebuild per swap.
- Long build times: budget with readiness checks and backoff; avoid cascading
  rebuilds by cooldown + dedupe.
- Admin endpoint exposure: restrict via OAuth/roles or shared secret; log/alert
  on use.

## Acceptance (MVP)

- Start runtime with cloud EaC loaded; hit a known route.
- Update EaC in steward; call `/_internal/eac/refresh`.
- Observe: 200 OK with refresh metadata; new/changed routes take effect without
  restart; concurrent requests unaffected.

Usage notes

- Refresh:
  - `POST /api/steward/_internal/eac/refresh` optional `?force=1`.
  - If `EAC_REFRESH_ENDPOINT_TOKEN` is set, include header
    `x-eac-refresh-token: <token>`.
  - Polling: set `EAC_REFRESH_POLL_INTERVAL_MS` (e.g., 30000) to enable
    background refresh; optional `EAC_REFRESH_POLL_JITTER_PCT` (0.0–0.9, default
    0.2) to stagger checks.
- Status:
  - `GET /api/steward/_internal/eac/status` returns controller + host status.
- Cooldown:
  - Set `EAC_REFRESH_COOLDOWN_MS` to prevent frequent swaps unless `force` is
    used.

---

# Implementation Progress

Status: Active development of Hot‑Swap MVP

What’s done

- RuntimeHost: hot‑swappable dispatcher that holds current route groups and
  exposes a root `Dispatch` handler.
  - File: `src/runtime/refresh/RuntimeHost.ts`
- EaCSource: fetches cloud EaC via Steward client using env/JWT and computes a
  change hash.
  - File: `src/runtime/refresh/EaCSource.ts`
- RuntimeBuilder: rebuilds IoC (processors, modifiers, DFS, Deno KV) and
  produces fresh route groups via `FathymEaCApplicationsPlugin`.
  - File: `src/runtime/refresh/RuntimeBuilder.ts`
- EaCRefreshController: orchestrates fetch → build → atomic swap into
  RuntimeHost, with single‑flight guard and cooldown.
  - File: `src/runtime/refresh/EaCRefreshController.ts`
- IoC integration (core): registers RuntimeHost, EaCSource, RuntimeBuilder,
  EaCRefreshController.
  - File: `src/runtime/plugins/FathymCorePlugin.ts`
- IoC integration (EaC loader): registers EaCSource in FathymEaCPlugin for
  on‑demand cloud fetches.
  - File: `src/runtime/plugins/FathymEaCPlugin.ts`
- Route publication: on `AfterEaCResolved`, Applications plugin publishes the
  built routes into RuntimeHost.
  - File: `src/runtime/plugins/FathymEaCApplicationsPlugin.ts`
- Admin endpoint: `POST /api/steward/_internal/eac/refresh` triggers a refresh
  via IoC controller; leverages Steward API app and its JWT protection. Optional
  `x-eac-refresh-token` header enforced when `EAC_REFRESH_ENDPOINT_TOKEN` is
  set. Supports `?force=1`.
  - File: `src/steward/api/eac/_internal/eac/refresh.ts`
- Status endpoint: `GET /api/steward/_internal/eac/status` returns controller +
  host status (last hash, last swap, revision, route group count).
  - File: `src/steward/api/eac/_internal/eac/status.ts`

Polling Implementation (added)

- Background polling with jitter/cooldown is implemented in the refresh
  controller and starts automatically when `EAC_REFRESH_POLL_INTERVAL_MS` > 0.
- Jitter percent is configurable via `EAC_REFRESH_POLL_JITTER_PCT` (default 0.2)
  to avoid synchronized checks across instances.
- Single-flight lock prevents overlapping rebuilds; cooldown still applies
  between successful swaps.
- Status endpoint reflects polling state (`polling`, `pollIntervalMs`,
  `lastPollAt`, `pollCount`).

In flight / Next

- Verification passes: run through a local flow to confirm:
  - Startup builds and publishes routes into RuntimeHost.
  - Hitting the refresh endpoint rebuilds routes and updates host revision.
- Cooldown tuning: confirm `EAC_REFRESH_COOLDOWN_MS` behavior under concurrent
  refreshes.
- Backoff/cooldown knobs: add env‑driven cooldown to avoid rapid rebuilds.
- Observability: structured logs + (optional) counters around fetch/build/swap.
- Dispatch integration: document/optionally expose a top‑level handler that
  proxies to `RuntimeHost.Dispatch` for consumers that want full hot‑swap
  without relying on default runtime handler construction.

Notes / Caveats

- Consumers must dispatch requests through `RuntimeHost.Dispatch` (or rely on
  the default runtime using Applications plugin route groups). We publish routes
  to the host at build time to support hot‑swap dispatch.
- ESBuild and other optional IoC providers are not forced here. If your EaC uses
  MDX/Preact, ensure `ESBuild` is registered in IoC (as in your current setup).
- Security relies on existing Steward API JWT validation; restrict who can call
  the refresh endpoint.
  - Optionally set `EAC_REFRESH_ENDPOINT_TOKEN` and provide
    `x-eac-refresh-token` on calls for an extra shared‑secret layer.

Next Additions

- Observability: structured logs + counters around fetch/build/swap, cooldown
  skips, polling iterations and outcomes.
- Optional conditional requests (ETag) in EaCSource when underlying client
  surfaces it.
