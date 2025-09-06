Fathym EaC Applications — Agents & Architecture Guide

This guide explains how this repository composes “agents” (plugins, resolvers,
and handlers) to turn Everything‑as‑Code (EaC) into a running application
runtime. It covers the runtime lifecycle, plugin system, IoC, routing, OAuth,
DFS, the Steward APIs, and the planned cloud EaC refresh mechanism.

Note: File paths below are workspace‑relative so you can click to open them in
your editor.

**What Lives Here**

- Core runtime plugins that assemble the graph: `src/runtime/plugins/*`
- Applications routing and pipeline composition:
  `src/runtime/plugins/FathymEaCApplicationsPlugin.ts`
- Processors and modifiers (declarative → handlers): `src/runtime/processors/*`,
  `src/runtime/modifiers/*`
- OAuth modules and helpers: `src/runtime/modules/oauth/*`
- Distributed file system (DFS) resolvers and wiring:
  `src/runtime/plugins/FathymDFSFileHandlerPlugin.ts`
- Deno KV wiring for state/sessions:
  `src/runtime/plugins/FathymEaCDenoKVPlugin.ts`
- Steward API and Steward lifecycle orchestration: `src/steward/plugins/*`,
  `src/steward/api/*`
- Default runtime config builder: `src/runtime/_/defineEaCApplicationsConfig.ts`

**Big Picture**

- Plugins act as agents that declare and assemble functionality. Each plugin
  can:
  - Provide EaC fragments (projects, applications, DFS, KV, modifiers).
  - Register resolvers into the IoC container.
  - Participate in lifecycle hooks (Setup, Build, AfterEaCResolved) to build the
    runtime graph.
- Resolvers are agents that translate declarative EaC into concrete handlers:
  - ProcessorHandlerResolver: builds app handlers from `Application.Processor`.
  - ModifierHandlerResolver: builds middleware from `ModifierResolvers`.
  - DFSFileHandlerResolver: resolves request handlers from DFS locations.
- The runtime composes these agents into a request pipeline that activates a
  project, then an application, then applies modifiers and finally runs the
  processor handler.

**Runtime Lifecycle**

- Startup config: `defineEaCApplicationsConfig` composes the default runtime
  with `FathymCorePlugin`.
  - `src/runtime/_/defineEaCApplicationsConfig.ts`
  - `FathymCorePlugin` wires together the core plugin stack.
- Plugin chain (default): `FathymCorePlugin`
  - `src/runtime/plugins/FathymCorePlugin.ts`
  - Plugins included, in order:
    - `FathymAzureContainerCheckPlugin`: readiness endpoints for Azure
      containers.
    - `FathymEaCPlugin`: loads/merges cloud EaC from the Steward service (if
      configured).
    - `FathymProcessorHandlerPlugin`: registers processor resolvers.
    - `FathymModifierHandlerPlugin`: registers modifier resolvers.
    - `FathymDFSFileHandlerPlugin`: registers DFS handler resolvers.
    - `FathymEaCDenoKVPlugin`: registers Deno KV instances into IoC based on
      EaC.
    - `FathymEaCApplicationsPlugin`: builds routes and pipelines from the final
      EaC.

**EaC Loading (Cloud + Local)**

- `src/runtime/plugins/FathymEaCPlugin.ts`
  - Reads `EAC_API_KEY` or constructs a JWT from `EAC_API_ENTERPRISE_LOOKUP` and
    optional `EAC_API_USERNAME` via `loadJwtConfig`.
  - Calls the Steward client (`loadEaCStewardSvc`) to fetch the current EaC for
    the enterprise and assigns it to the plugin’s `EaC` portion of the runtime
    config.
  - If cloud fetch fails, it logs and falls back to whatever other plugins
    provide.
  - Ensures `EnterpriseLookup` is set on the merged EaC.

**Routing & Pipelines**

- `src/runtime/plugins/FathymEaCApplicationsPlugin.ts`
  - After EaC is resolved, builds the runtime route matrix:
    - Project graph: derives URLPattern matchers from
      `Projects[...].ResolverConfigs` (hostname, port, path).
    - Application graph: for each project, sorts application resolvers by
      priority and attaches the resolved handler pipeline.
  - Request activation flow:
    - Project activator: matches hostname/port/path against configured
      `ResolverConfigs`.
    - Application activator: matches `PathPattern`, optional `AllowedMethods`,
      optional `UserAgentRegex`, and access rights.
    - On activation, it merges context with the `ProjectProcessorConfig` and
      `ApplicationProcessorConfig` so downstream middleware and handlers can use
      it.
  - Pipeline composition:
    - Appends middleware from modifiers based on project and application
      `ModifierResolvers` (ordered by priority).
    - Appends the final application handler resolved from the processor.
  - Cache control:
    - If the app processor declares `CacheControl` and not in `EAC_RUNTIME_DEV`,
      responses are wrapped to apply cache headers.

**Application Resolver Configuration**

- `src/applications/EaCApplicationResolverConfiguration.ts`
  - `PathPattern`: glob‑like path match for the route.
  - `Priority`: higher wins when multiple match.
  - `AllowedMethods`: optional allowlist of HTTP methods.
  - `UserAgentRegex`: optional UA filter.
  - `IsPrivate`: gate behind OAuth; `IsTriggerSignIn`: redirect to sign‑in when
    not authenticated.
  - `AccessRightLookups` + `IsAnyAccessRight`: coarse‑grained role gating (see
    OAuth section).

**IoC & Resolvers**

- IoC container is used to register and resolve handlers and services by
  symbol + optional name.
  - Processors: `src/runtime/plugins/FathymProcessorHandlerPlugin.ts` registers
    resolvers for known processor types.
  - Modifiers: `src/runtime/plugins/FathymModifierHandlerPlugin.ts` registers
    resolvers for known modifier types.
  - DFS: `src/runtime/plugins/FathymDFSFileHandlerPlugin.ts` registers resolvers
    for multiple DFS backends (Local, JSR, NPM, Remote, Worker, Azure Blob, Deno
    KV).
  - Deno KV: `src/runtime/plugins/FathymEaCDenoKVPlugin.ts` registers configured
    KV instances by lookup.
  - Logging: `src/runtime/logging/EaCApplicationsLoggingProvider.ts` provides
    default logging packages and levels.

**OAuth & Authorization**

- Middleware modifier: `src/runtime/modules/oauth/oauthMiddleware.ts`
  - `establishOAuthMiddleware` enforces `IsPrivate` routes and optional
    `IsTriggerSignIn` behavior.
  - Loads provider config (Azure AD/B2C, GitHub, generic OAuth) via
    `loadOAuth2ClientConfig`.
  - Uses Deno KV to store session state and enriches runtime context with
    `Username` and derived `AccessRights`.
- Modifier resolver: `src/runtime/modifiers/EaCOAuthModifierHandlerResolver.ts`
  builds the middleware when an application or project declares an OAuth
  modifier.
- OAuth processor: `src/runtime/processors/EaCOAuthProcessorHandlerResolver.ts`
  - Implements sign‑in and callback flows against configured providers.
  - Persists per‑provider connection tokens in Deno KV and maintains a “current”
    session mapping.
  - Integration points for deriving the primary email/username from provider
    tokens.
- Access rights are currently a placeholder hook in `oauthMiddleware.ts`
  (`getAccessRightsForUser`). Routes can require rights via
  `AccessRightLookups`.

**Steward APIs & Lifecycle**

- API plugin: `src/steward/plugins/EaCStewardAPIPlugin.ts`
  - Contributes an API application (default path `/api/steward*`) backed by DFS
    files in `src/steward/api/eac/`.
  - Adds an optional JWT validation modifier to protect the endpoints.
  - Configures Deno KV databases for Steward and Commit state.
- Steward service plugin: `src/steward/plugins/EaCStewardPlugin.ts`
  - Starts the Steward service (commit processing, status) using configured Deno
    KVs.
  - On empty startup, bootstraps a primary “core EaC” with users from
    `EAC_CORE_USERS` and prints a long‑lived JWT for administration.
  - Exposes Steward state and processing used by clients like `FathymEaCPlugin`.

**Processors (Selected)**

- API: Route functions from DFS (`src/steward/api/...`).
- DFS/MDX/Tailwind/Preact: Static or dynamic site/app content from DFS; MDX and
  Tailwind processors transform content.
- Proxy/Redirect/Response: Networking primitives for simple behaviors.
- OAuth: Sign‑in and callback flow endpoints.
- Messaging: Azure Event Hubs and NATS processors for event‑driven applications.
- Stripe: Payment flows.
  - See registrations in `src/runtime/plugins/FathymProcessorHandlerPlugin.ts`
    and implementations under `src/applications/processors/*`.

**Modifiers (Selected)**

- OAuth, JWTValidation: Auth gating.
- DenoKVCache, KeepAlive: Caching and connection health.
- MarkdownToHTML, BaseHREF, GoogleTagMgr, MS App Insights, Tracing, Stripe.
  - See registrations in `src/runtime/plugins/FathymModifierHandlerPlugin.ts`
    and implementations under `src/runtime/modifiers/*` and
    `src/runtime/modules/*`.

**Distributed File Systems (DFS)**

- DFS lets you mount request handlers and assets from different sources:
  - Local: files in this repo (e.g., `src/steward/api/eac/*`).
  - JSR/NPM/Remote: load handlers from packages or remote locations.
  - Deno KV/Azure Blob/Worker: alternative storage/compute backends.
- The DFS resolver is picked by `DFSs[lookup].Details.Type`. The API plugin
  chooses Local vs JSR based on `import.meta.resolve`.

**Request Flow (End‑to‑End)**

- Incoming request → Project activator selects a project by hostname/port/path.
- Application activator evaluates path pattern, method, UA, and access rights.
- Pipeline executes:
  - Context enrichment (project/app configs).
  - Modifier middleware in priority order (auth, tracing, cache, etc.).
  - Processor handler resolves and returns the response.
- Cache headers may be applied post‑handler if configured.

**Cloud EaC Refresh (Planned, Implemented Here)**

- Current: `FathymEaCPlugin` loads cloud EaC on startup from the Steward
  service.
- Goal: refresh cloud EaC at runtime without restart, then rebuild and swap the
  runtime.
- Components to introduce (repo‑local):
  - EaCSource: fetch + merge EaC via `loadEaCStewardSvc`; track ETag/hash.
  - RuntimeBuilder: rebuild the full runtime (same lifecycle) from a snapshot.
  - RuntimeHost: hold current handler with atomic `swap` and drain.
  - EaCRefreshController: orchestrate change detection → build → readiness →
    swap.
- Triggers:
  - IoC method `requestEaCRefresh()` registered by `FathymEaCPlugin`.
  - Protected admin endpoint (e.g., `POST /_internal/eac/refresh`) using
    existing Steward/API plumbing.
  - Optional polling with conditional requests; eventing later.
- Safety:
  - Single‑flight lock, cooldowns, failure retention, structured logs/metrics.

**Configuration & Environment**

- Cloud EaC:
  - `EAC_API_KEY`: JWT to access Steward EaC.
  - `EAC_API_ENTERPRISE_LOOKUP`: create a JWT for this enterprise if
    `EAC_API_KEY` is not set.
  - `EAC_API_USERNAME`: optional username for JWT creation.
- Steward databases:
  - `STEWARD_DENO_KV_PATH`, `STEWARD_COMMIT_DENO_KV_PATH`: Deno KV file paths.
  - `EAC_CORE_USERS`: `user1@contoso.com|user2@contoso.com` for initial
    bootstrap.
- DFS global options:
  - `EaC.$GlobalOptions.DFSs.PreventWorkers: true` disables worker‑based DFS
    where necessary.
- Runtime:
  - `EAC_RUNTIME_DEV()`: disables cache wrapping when true.

**Logging & Observability**

- Default logging provider:
  `src/runtime/logging/EaCApplicationsLoggingProvider.ts` sets logging packages
  for consistent output.
- Expect debug logs for route activation, pipeline construction, and cloud EaC
  loading.
- Recommended to add metrics around:
  - Cloud EaC fetch latency and ETag hits.
  - Runtime build and swap duration.
  - Refresh success/failure counts.

**Extending the System**

- Add a new Processor:
  - Define its details/type under `src/applications/processors/*`.
  - Implement a `ProcessorHandlerResolver` in `src/runtime/processors/*`.
  - Register it in `FathymProcessorHandlerPlugin` with a unique IoC name.
- Add a new Modifier:
  - Define details under `src/applications/modifiers/*`.
  - Implement `ModifierHandlerResolver` in `src/runtime/modifiers/*`.
  - Register it in `FathymModifierHandlerPlugin`.
- Add a new DFS backend:
  - Implement a DFS handler resolver and register it in
    `FathymDFSFileHandlerPlugin`.
- Contribute EaC at startup:
  - Add a plugin that returns `EaC` fragments in its `Setup()` method.

**Local Development Pointers**

- Compose a runtime config with `defineEaCApplicationsConfig` and include
  `FathymCorePlugin` (already the default).
- Provide env vars for cloud EaC to pull live configuration or rely on local
  plugin‑provided EaC.
- To test Steward APIs locally:
  - Ensure `STEWARD_DENO_KV_PATH` and `STEWARD_COMMIT_DENO_KV_PATH` point to
    writable KV files.
  - Hit routes under the configured API path (default `/api/steward*`).

**Gotchas & Best Practices**

- Avoid static singletons tied to EaC values; attach instance state to IoC or
  the runtime context so refresh/hot‑swap stays safe.
- Honor `Priority` ordering for both application resolvers and modifiers.
- Use `URLPattern` carefully for hostname/port/path matching; test overlapping
  patterns.
- When protecting admin/refresh endpoints, enforce OAuth roles or a shared
  secret header.

**Where to Look First**

- Entry wiring: `src/runtime/_/defineEaCApplicationsConfig.ts`
- Plugin chain: `src/runtime/plugins/FathymCorePlugin.ts`
- Cloud EaC loader: `src/runtime/plugins/FathymEaCPlugin.ts`
- Route/pipeline builder: `src/runtime/plugins/FathymEaCApplicationsPlugin.ts`
- Steward APIs and bootstrapping: `src/steward/plugins/*`, `src/steward/api/*`
