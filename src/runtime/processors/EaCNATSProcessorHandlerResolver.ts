import { Msg, RetentionPolicy } from "npm:nats@2.29.2";
import {
  connect,
  EaCNATSProcessor,
  EaCRuntimeContext,
  EaCRuntimeHandlerSet,
  executePathMatch,
  isEaCNATSProcessor,
  JetStreamManager,
  loadDFSFileHandler,
  loadEaCRuntimeHandlers,
  loadMiddleware,
  loadRequestPathPatterns,
  LoggingProvider,
  NatsConnection,
  StringCodec,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";
import { StorageType } from "npm:nats@2.29.2";
import { Logger } from "jsr:@std/log@0.224.14/logger";
import { EaCRuntimeHandlerPipeline } from "jsr:@fathym/eac@0.2.102/runtime/pipelines";
import { PathMatch } from "jsr:@fathym/eac@0.2.102/dfs/utils";
import { buildURLMatch } from "jsr:@fathym/common@0.2.179";

export const EaCNATSProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    const logger = (await ioc.Resolve(LoggingProvider)).Package;

    if (!isEaCNATSProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCNATSProcessorHandlerResolver.",
      );
    }

    // debugger;
    const processor = appProcCfg.Application.Processor as EaCNATSProcessor;

    try {
      console.log(
        `🚀 Initializing EaCNATSProcessor for ${processor.DFSLookup}...`,
      );

      // Load DFS File Handler
      const fileHandler = await loadDFSFileHandler(
        ioc,
        eac.DFSs!,
        eac.$GlobalOptions?.DFSs ?? {},
        processor.DFSLookup,
      );

      if (!fileHandler) {
        throw new Error(
          `❌ Failed to load DFS file handler for ${processor.DFSLookup}`,
        );
      }

      const buildContext = async (): Promise<EaCRuntimeContext> => {
        return {
          Data: {},
          Runtime: {
            // Config: this.config,
            EaC: eac,
            // Info: info,
            IoC: ioc,
            Logs: await ioc.Resolve<LoggingProvider>(LoggingProvider),
            Revision: appProcCfg.Revision,
          },
          // URLMatch: buildURLMatch(pattern, req),
          State: {},
        } as unknown as EaCRuntimeContext;
      };

      const dfs = eac.DFSs![processor.DFSLookup]!.Details!;

      // Load middleware and handlers dynamically
      const patterns = await loadRequestPathPatterns<{
        middleware: [string, EaCRuntimeHandlerSet][];
      }>(
        fileHandler,
        dfs,
        async (allPaths) => {
          const middlewareLoader = async () => {
            const middlewarePaths = allPaths
              .filter((p) => p.endsWith("_middleware.ts"))
              .sort((a, b) => a.split("/").length - b.split("/").length);

            const middlewareCalls = middlewarePaths.map((p) =>
              loadMiddleware(logger, fileHandler, p, dfs, processor.DFSLookup)
            );

            return (await Promise.all(middlewareCalls))
              .filter((m) => m)
              .map((m) => m!);
          };

          const [middleware] = await Promise.all([middlewareLoader()]);

          if (middleware?.length) {
            logger.debug(`Middleware - ${processor.DFSLookup}:`);
            middleware
              .map(
                (m) =>
                  `${appProcCfg.ResolverConfig.PathPattern.replace("*", "")}${
                    m[0].startsWith(".") ? m[0].slice(1) : m[0]
                  }`,
              )
              .forEach((pt) => logger.debug(`\t${pt}`));
            logger.debug("");
          }

          return { middleware };
        },
        async (filePath) => {
          return await loadEaCRuntimeHandlers(
            logger,
            fileHandler,
            filePath,
            dfs,
            processor.DFSLookup,
          );
        },
        (filePath, pipeline, { middleware }) => {
          const reqMiddleware = middleware
            .filter(([root]) => filePath.startsWith(root))
            .flatMap(([_root, handler]) =>
              Array.isArray(handler) ? handler : [handler]
            );

          pipeline.Prepend(...reqMiddleware);
        },
        appProcCfg.Revision,
      );

      if (patterns?.length) {
        logger.debug(`Events - ${processor.DFSLookup}:`);
        patterns
          .map((p) => p.PatternText)
          .map(
            (pt) =>
              `${processor.EventRoot}${
                pt.endsWith("/") ? pt.substring(0, pt.length - 1) : pt
              }`,
          )
          .forEach((pt) => logger.debug(`\t${pt}`));
        logger.debug("");
      }

      // Initialize NATS connection
      logger.debug("🔹 Connecting to NATS...");

      const nc: NatsConnection = await connect({
        servers: processor.NATSURL,
        maxReconnectAttempts: processor.MaxReconnects ?? 5,
        reconnectTimeWait: processor.ReconnectDelayMs ?? 2000,
        ...processor.ClientOptions,
      });

      logger.debug("✅ NATS Connected");

      let jsm: JetStreamManager | null = null;

      if (processor.JetStream?.Enabled) {
        logger.debug("Setting up JetStream...");

        jsm = await nc.jetstreamManager();

        await setupJetStream(jsm, processor);
      }

      logger.debug("🔹 Subscribing to events...");

      for (const pattern of patterns) {
        nc.subscribe(`${processor.EventRoot}${pattern.PatternText}`, {
          callback: async (err, msg) => {
            if (err) {
              logger.error(
                `❌ Error processing event: ${pattern.PatternText}`,
                err,
              );
              return;
            }

            await handleNATSEvent(logger, msg, pattern, await buildContext());
          },
        });
      }

      return (_req, _ctx) => {
        const handledEvents = patterns.map(
          (p) => `${processor.EventRoot}${p.PatternText}`,
        );

        return Response.json({ Events: handledEvents });
      };
    } catch (err) {
      if (err instanceof Error) {
        logger.error(
          `Error processing ${appProcCfg.ApplicationLookup} NATS processor: ${err.message}`,
        );
      }
      throw err;
    }
  },
};

/**
 * Handles an incoming NATS event message.
 */
async function handleNATSEvent(
  logger: Logger,
  msg: Msg,
  pattern: PathMatch,
  ctx: EaCRuntimeContext,
) {
  const SC = StringCodec();

  logger.debug(`📥 Processing event: ${msg.subject}`);

  // Convert NATS headers to standard HTTP Headers
  const requestHeaders = new Headers();
  if (msg.headers) {
    msg.headers.keys().forEach((key) => {
      requestHeaders.set(key, msg.headers!.get(key));
    });
  }

  let request = new Request(
    new URL(pattern.PatternText, `nats://eac-applications/`),
    {
      method: "POST",
      body: msg.data.length > 0 ? SC.decode(msg.data) : null,
      headers: requestHeaders,
    },
  );

  // Update runtime context with URL pattern match
  ctx.Runtime.URLMatch = buildURLMatch(pattern.Pattern, request);

  // Execute the event handler
  const response = await pattern.Handlers.Execute(request, ctx);

  // Handle response: Reply if body exists, otherwise just ACK
  if (response?.body) {
    await msg.respond(SC.encode(await response.text()));
  } else {
    await msg.respond(new Uint8Array()); // ACK without body
  }
}

/**
 * Sets up JetStream streams dynamically.
 */
async function setupJetStream(
  jsm: JetStreamManager,
  processor: EaCNATSProcessor,
) {
  if (processor.JetStream?.Enabled) {
    for (const stream of processor.JetStream.Streams) {
      try {
        await jsm.streams.add({
          name: stream.Name,
          subjects: stream.Subjects,
          retention: stream.Retention ?? RetentionPolicy.Limits,
          storage: stream.Storage ?? StorageType.Memory,
          max_msgs: stream.MaxMsgs ?? -1,
          max_bytes: stream.MaxBytes ?? -1,
          max_consumers: stream.MaxConsumers ?? -1,
          no_ack: stream.NoAck ?? false,
        });
        console.log(
          `✅ Created stream: ${stream.Name} (${stream.Subjects.join(", ")})`,
        );
      } catch (_err) {
        console.warn(
          `⚠️ Stream ${stream.Name} already exists or failed to create.`,
        );
      }
    }
  }
}
