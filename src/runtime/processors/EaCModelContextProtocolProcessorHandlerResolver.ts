// deno-lint-ignore-file no-explicit-any
import { importDFSTypescriptModule } from "jsr:@fathym/eac@0.2.131/dfs/utils";
import type { EaCRuntimeContext } from "jsr:@fathym/eac@0.2.131/runtime";
import {
  EaCModelContextProtocolProcessor,
  isEaCModelContextProtocolProcessor,
  loadDFSFileHandler,
  LoggingProvider,
} from "./.deps.ts";
import {
  executeTool,
  type MCPHandshakeMetadata,
  type MCPResourceResponse,
  type MCPToolInvocation,
  ModelContextProtocolRuntime,
  renderPrompt,
  resolveResource,
  subscribeToEvent,
} from "../mcp/.exports.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

const TEXT_ENCODER = new TextEncoder();

function extractRelativePath(
  url: URL,
  pathPattern: string | undefined,
): string {
  const base = (pathPattern ?? "*").replace("*", "");

  if (base && url.pathname.startsWith(base)) {
    return url.pathname.slice(base.length).replace(/^\/+/, "");
  }

  return url.pathname.replace(/^\/+/, "");
}

function normalizeToken(req: Request): string | undefined {
  const auth = req.headers.get("authorization");

  if (!auth) return undefined;

  const trimmed = auth.trim();

  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }

  return trimmed || undefined;
}

function serializeJson(data: unknown): string {
  return typeof data === "string" ? data : JSON.stringify(data ?? null);
}

export const EaCModelContextProtocolProcessorHandlerResolver:
  ProcessorHandlerResolver = {
    async Resolve(ioc, appProcCfg, eac) {
      const logger = (await ioc.Resolve(LoggingProvider)).Package;

      if (
        !isEaCModelContextProtocolProcessor(appProcCfg.Application.Processor)
      ) {
        throw new Deno.errors.NotSupported(
          "The provided processor is not supported for the EaCModelContextProtocolProcessorHandlerResolver.",
        );
      }

      const processor = appProcCfg.Application
        .Processor as EaCModelContextProtocolProcessor;

      const fileHandler = await loadDFSFileHandler(
        ioc,
        eac.DFSs!,
        eac.$GlobalOptions?.DFSs ?? {},
        processor.DFSLookup,
      );

      const dfs = eac.DFSs![processor.DFSLookup]!.Details!;

      const rootModule = await importDFSTypescriptModule(
        logger,
        fileHandler!,
        "./.mcp.ts",
        dfs,
        processor.DFSLookup,
        "ts",
      );

      if (!rootModule?.module?.default) {
        throw new Deno.errors.NotSupported(
          `Expected default export from .mcp.ts for processor '${processor.DFSLookup}'.`,
        );
      }

      const runtime = new ModelContextProtocolRuntime();

      const setup = rootModule.module.default as (
        runtime: ModelContextProtocolRuntime,
      ) => Promise<void> | void;

      await setup(runtime);

      const moduleExports = rootModule.module as Record<string, unknown>;

      if (!runtime.GetHandshake()) {
        const handshakeExport = moduleExports.handshake;

        if (typeof handshakeExport === "function") {
          const metadata = await (handshakeExport as (
            runtime: ModelContextProtocolRuntime,
          ) =>
            | Promise<MCPHandshakeMetadata | void>
            | MCPHandshakeMetadata
            | void)(
              runtime,
            );

          if (metadata) {
            runtime.SetHandshake(metadata);
          }
        } else if (handshakeExport) {
          runtime.SetHandshake(handshakeExport as MCPHandshakeMetadata);
        }
      }

      const hooksExport = moduleExports.hooks as {
        auth?: (
          token: string | undefined,
          ctx: EaCRuntimeContext,
        ) => Promise<unknown>;
        error?: (
          error: unknown,
          ctx: EaCRuntimeContext,
        ) => Promise<Response | void>;
        handshake?: (
          ctx: EaCRuntimeContext,
        ) => Promise<MCPHandshakeMetadata | void>;
      } | undefined;

      if (hooksExport?.auth) {
        runtime.OnAuth(hooksExport.auth);
      }

      if (hooksExport?.error) {
        runtime.OnError(hooksExport.error);
      }

      if (hooksExport?.handshake) {
        runtime.OnHandshake(hooksExport.handshake);
      }

      if (typeof moduleExports.onAuth === "function") {
        runtime.OnAuth(
          moduleExports.onAuth as (
            token: string | undefined,
            ctx: EaCRuntimeContext,
          ) => Promise<unknown>,
        );
      }

      if (typeof moduleExports.onError === "function") {
        runtime.OnError(
          moduleExports.onError as (
            error: unknown,
            ctx: EaCRuntimeContext,
          ) => Promise<Response | void>,
        );
      }

      if (typeof moduleExports.onHandshake === "function") {
        runtime.OnHandshake(
          moduleExports.onHandshake as (
            ctx: EaCRuntimeContext,
          ) => Promise<MCPHandshakeMetadata | void>,
        );
      }

      if (!runtime.GetHandshake()) {
        runtime.SetHandshake({
          Id: processor.ProfileLookup ?? appProcCfg.ApplicationLookup,
          Name: processor.ProfileLookup ?? appProcCfg.ApplicationLookup,
          Version: "1.0.0",
        });
      }

      const hooks = runtime.Hooks();

      return async (req, ctx) => {
        const context = ctx as EaCRuntimeContext;
        const url = new URL(req.url);
        const relativePath = extractRelativePath(
          url,
          appProcCfg.ResolverConfig.PathPattern,
        );
        const path = relativePath.replace(/\/+$/, "");
        const method = req.method.toUpperCase();

        const applyAuth = async (optional = false) => {
          if (!hooks.Auth) return;
          const token = normalizeToken(req);

          if (!token && optional) return;

          await hooks.Auth(token, context);
        };

        try {
          if ((path === "" || path === "handshake") && method === "POST") {
            await applyAuth(true);

            let handshake = runtime.GetHandshake();

            if (hooks.Handshake) {
              const hookResult = await hooks.Handshake(context);

              if (hookResult) {
                handshake = {
                  ...(handshake ?? {}),
                  ...hookResult,
                };
              }
            }

            const toolMetas = runtime.Tools.Entries().map((def) => {
              const { Handler: _handler, ...meta } = def;
              return meta;
            });

            const resourceMetas = runtime.Resources.Entries().map((def) => {
              const { Handler: _handler, ...meta } = def;
              return meta;
            });

            const eventMetas = runtime.Events.Entries().map((def) => {
              const { Handler: _handler, ...meta } = def;
              return meta;
            });

            const promptMetas = runtime.Prompts.Entries().map((def) => {
              const { Handler: _handler, ...meta } = def;
              return meta;
            });

            const profiles = processor.ProfileLookup
              ? [processor.ProfileLookup]
              : undefined;

            return Response.json({
              Handshake: handshake,
              Tools: toolMetas,
              Resources: resourceMetas,
              Events: eventMetas,
              Prompts: promptMetas,
              Profiles: profiles,
            });
          }

          if (path.startsWith("tools/") && method === "POST") {
            await applyAuth();

            const toolId = path.slice("tools/".length);

            if (!toolId) {
              return new Response("Tool id missing.", { status: 400 });
            }

            let body: any = undefined;

            if (req.headers.get("content-type")?.includes("application/json")) {
              body = await req.json();
            } else if (req.body) {
              const text = await req.text();
              body = text ? JSON.parse(text) : undefined;
            }

            const invocation: MCPToolInvocation = {
              Tool: toolId,
              Params: body?.params ?? body ?? {},
            };

            const result = await executeTool(runtime, {
              Invocation: invocation,
              Context: context,
            });

            if (result instanceof Response) {
              return result;
            }

            if (result === undefined) {
              return new Response(null, { status: 204 });
            }

            return Response.json({ Result: result });
          }

          if (path.startsWith("resources/") && method === "GET") {
            await applyAuth();

            const resourceId = path.slice("resources/".length);

            if (!resourceId) {
              return new Response("Resource id missing.", { status: 400 });
            }

            const query: Record<string, string> = {};
            url.searchParams.forEach((value, key) => {
              query[key] = value;
            });

            const ifNoneMatch = req.headers.get("if-none-match") ?? undefined;
            const resourceResponse = await resolveResource(runtime, {
              Resource: resourceId,
              Query: query,
              ETag: ifNoneMatch,
            }, context);

            if (resourceResponse instanceof Response) {
              return resourceResponse;
            }

            const response = resourceResponse as MCPResourceResponse;
            const headers = new Headers();

            if (response.ETag) {
              headers.set("ETag", response.ETag);
            }

            if (
              response.ETag && ifNoneMatch &&
              ifNoneMatch.replace(/"/g, "") === response.ETag.replace(/"/g, "")
            ) {
              return new Response(null, { status: 304, headers });
            }

            if (response.Modified) {
              headers.set("Last-Modified", response.Modified);
            }

            if (response.ContentType) {
              headers.set("Content-Type", response.ContentType);
            }

            const contentType = response.ContentType ?? "application/json";
            const payload = contentType.includes("json")
              ? serializeJson(response.Data)
              : typeof response.Data === "string"
              ? response.Data
              : serializeJson(response.Data);

            if (!headers.has("Content-Type")) {
              headers.set("Content-Type", contentType);
            }

            return new Response(payload, {
              status: 200,
              headers,
            });
          }

          if (path.startsWith("events/") && method === "GET") {
            await applyAuth();

            const eventId = path.slice("events/".length);

            if (!eventId) {
              return new Response("Event id missing.", { status: 400 });
            }

            const cursor = url.searchParams.get("cursor") ?? undefined;

            const iterable = await subscribeToEvent(
              runtime,
              { Event: eventId, Cursor: cursor },
              context,
            );

            const stream = new ReadableStream({
              async start(controller) {
                try {
                  for await (const message of iterable as AsyncIterable<any>) {
                    controller.enqueue(
                      TEXT_ENCODER.encode(
                        `data: ${serializeJson(message)}\n\n`,
                      ),
                    );
                  }
                  controller.close();
                } catch (error) {
                  controller.error(error);
                }
              },
              async cancel() {
                if (typeof (iterable as any)?.return === "function") {
                  await (iterable as any).return();
                }
              },
            });

            return new Response(stream, {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }

          if (path.startsWith("prompts/") && method === "GET") {
            await applyAuth();

            const promptId = path.slice("prompts/".length);

            if (!promptId) {
              return new Response("Prompt id missing.", { status: 400 });
            }

            const prompt = await renderPrompt(runtime, promptId, context);

            return Response.json(prompt);
          }

          return new Response("Not Found", { status: 404 });
        } catch (error) {
          if (hooks.Error) {
            const handled = await hooks.Error(error, context);
            if (handled) return handled;
          }

          throw error;
        }
      };
    },
  };
