import {
  connect,
  JetStreamManager,
  Msg,
  NatsConnection,
  RetentionPolicy,
  StorageType,
  StringCodec,
} from "npm:nats@2.29.2";
import {
  EaCApplicationProcessorConfig,
  EaCNATSProcessor,
  EaCRuntimeContext,
  EverythingAsCode,
  EverythingAsCodeDFS,
  IoCContainer,
  isEaCNATSProcessor,
  Logger,
  LoggingProvider,
} from "./.deps.ts";
import {
  EaCRuntimeHandlerPipeline,
  EaCRuntimeHandlerSet,
} from "jsr:@fathym/eac@0.2.130/runtime/pipelines";
import { PathMatch } from "jsr:@fathym/eac@0.2.130/dfs/utils";
import { buildURLMatch } from "jsr:@fathym/common@0.2.273";
import { BaseEaCMessagingProcessorHandlerResolver } from "./BaseEaCMessagingProcessorHandlerResolver.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

export const EaCNATSProcessorHandlerResolver: ProcessorHandlerResolver =
  new (class
    extends BaseEaCMessagingProcessorHandlerResolver<EaCNATSProcessor> {
    async Resolve(
      ioc: IoCContainer,
      appProcCfg: EaCApplicationProcessorConfig,
      eac: EverythingAsCode & EverythingAsCodeDFS,
    ): Promise<(req: Request, ctx: unknown) => Promise<Response>> {
      const logger = (await ioc.Resolve(LoggingProvider)).Package;

      if (!isEaCNATSProcessor(appProcCfg.Application.Processor)) {
        throw new Deno.errors.NotSupported(
          "The provided processor is not supported for the EaCNATSProcessorHandlerResolver.",
        );
      }

      const processor = appProcCfg.Application.Processor;

      console.log(
        `🚀 Initializing EaCNATSProcessor for ${processor.DFSLookup}...`,
      );

      const { patterns } = await this.loadPatterns(
        processor,
        ioc,
        eac,
        appProcCfg,
        logger,
      );

      if (patterns?.length) {
        logger.debug(`Events - ${processor.DFSLookup}:`);

        patterns
          .map((p) => this.pathToSubject(processor.EventRoot, p.Pattern))
          .forEach((pt) => logger.debug(`\t${pt}`));
        logger.debug("");
      }

      logger.debug("🔹 Connecting to NATS...");

      const nc: NatsConnection = await connect({
        servers: processor.NATSURL,
        maxReconnectAttempts: processor.MaxReconnects ?? 5,
        reconnectTimeWait: processor.ReconnectDelayMs ?? 2000,
        ...processor.ClientOptions,
      });

      logger.debug("✅ NATS Connected");

      ioc.Register(() => nc, {
        Type: ioc.Symbol("NatsConnection"),
      });

      let jsm: JetStreamManager | null = null;

      if (processor.JetStream?.Enabled) {
        logger.debug("Setting up JetStream...");

        jsm = await nc.jetstreamManager();
        await this.setupJetStream(jsm, processor);
      }

      logger.debug("🔹 Subscribing to events...");

      for (const pattern of patterns) {
        nc.subscribe(this.pathToSubject(processor.EventRoot, pattern.Pattern), {
          callback: async (err, msg: Msg) => {
            if (err) {
              logger.error(
                `❌ Error processing event: ${pattern.PatternText}`,
                err,
              );
              return;
            }

            const pathname = msg.subject.replace(/\./g, "/");

            const match = pattern.Pattern.exec({ pathname });

            const ctx = await this.buildContext(ioc, eac, appProcCfg, {
              Params: match?.pathname?.groups,
            });

            await this.handleNATSEvent(
              logger,
              processor.EventRoot,
              msg,
              pattern,
              ctx,
            );
          },
        });
      }

      return (_req, _ctx) => {
        const handledEvents = patterns.map(
          (p) => `${processor.EventRoot}${p.PatternText}`,
        );
        return Promise.resolve(Response.json({ Events: handledEvents }));
      };
    }

    /**
     * Converts a URL-style route pattern into a JetStream-compatible subject.
     *
     * Named parameters (e.g. :entLookup) are replaced with '*'.
     *
     * Examples:
     *  pathToSubject('eac', new URLPattern({ pathname: '/:entLookup/snapshots/commit' }))
     *  → 'eac.*.snapshots.commit'
     */
    protected pathToSubject(eventRoot: string, pattern: URLPattern): string {
      const normalizedRoot = eventRoot.replace(/^\.+|\.+$/g, "").trim();

      const path = pattern.pathname.replace(/\/+$/, "");

      const segments = path
        .split("/")
        .filter(Boolean)
        .map((segment) => (segment.startsWith(":") ? "*" : segment));

      const subject = segments.join(".");

      return [normalizedRoot, subject].filter(Boolean).join(".");
    }

    /**
     * Handles an incoming NATS event message.
     */
    protected async handleNATSEvent(
      logger: Logger,
      eventRoot: string,
      msg: Msg,
      pattern: PathMatch,
      ctx: EaCRuntimeContext,
    ) {
      const SC = StringCodec();

      logger.debug(`📥 Processing event: ${msg.subject}`);

      const requestHeaders = new Headers();
      if (msg.headers) {
        msg.headers.keys().forEach((key) => {
          requestHeaders.set(key, msg.headers!.get(key));
        });
      }

      const pathname = msg.subject.replace(/\./g, "/");

      const request = new Request(
        new URL(pathname, `https://fathym-nats-server:4222/${eventRoot}/`),
        {
          method: "POST",
          body: msg.data.length > 0 ? SC.decode(msg.data) : null,
          headers: requestHeaders,
        },
      );

      ctx.Runtime.URLMatch = buildURLMatch(pattern.Pattern, request);

      const response = await pattern.Handlers.Execute(request, ctx);

      if (response?.body) {
        await msg.respond(SC.encode(await response.text()));
      } else {
        await msg.respond(new Uint8Array()); // ACK without body
      }
    }

    /**
     * Sets up JetStream streams dynamically.
     */
    protected async setupJetStream(
      jsm: JetStreamManager,
      processor: EaCNATSProcessor,
    ) {
      if (processor.JetStream) {
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
              `✅ Created stream: ${stream.Name} (${
                stream.Subjects.join(
                  ", ",
                )
              })`,
            );
          } catch (_err) {
            console.warn(
              `⚠️ Stream ${stream.Name} already exists or failed to create.`,
            );
          }
        }
      }
    }
  })();
