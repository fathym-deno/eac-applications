import {
  buildURLMatch,
  EaCApplicationProcessorConfig,
  EaCRuntimeContext,
  EventHubConsumerClient,
  EverythingAsCode,
  EverythingAsCodeDFS,
  IoCContainer,
  Logger,
  LoggingProvider,
} from "./.deps.ts";

import {
  EaCAzureEventHubProcessor,
  isEaCAzureEventHubProcessor,
} from "../../applications/processors/EaCAzureEventHubProcessor.ts";

import { BaseEaCMessagingProcessorHandlerResolver } from "./BaseEaCMessagingProcessorHandlerResolver.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

export const EaCAzureEventHubProcessorHandlerResolver:
  ProcessorHandlerResolver =
    new (class extends BaseEaCMessagingProcessorHandlerResolver<
      EaCAzureEventHubProcessor
    > {
      async Resolve(
        ioc: IoCContainer,
        appProcCfg: EaCApplicationProcessorConfig,
        eac: EverythingAsCode & EverythingAsCodeDFS,
      ): Promise<(req: Request, ctx: unknown) => Promise<Response>> {
        const logger = (await ioc.Resolve(LoggingProvider)).Package;

        if (!isEaCAzureEventHubProcessor(appProcCfg.Application.Processor)) {
          throw new Deno.errors.NotSupported(
            "The provided processor is not supported for the EaCAzureEventHubProcessorHandlerResolver.",
          );
        }

        const processor = appProcCfg.Application.Processor;

        console.log(
          `🚀 Initializing EaCAzureEventHubProcessor for ${processor.DFSLookup}...`,
        );

        const { patterns } = await this.loadPatterns(
          processor,
          ioc,
          eac,
          appProcCfg,
          logger,
        );

        const consumer = new EventHubConsumerClient(
          processor.ConsumerGroup ?? "$Default",
          processor.ConnectionString,
          processor.EventHubName,
        );

        logger.debug(
          `🔹 Subscribing to Azure Event Hub: ${processor.EventHubName}`,
        );

        consumer.subscribe({
          processEvents: async (events) => {
            for (const event of events) {
              const pattern = patterns[0]; // TODO: Schema-aware event routing based on content

              if (!pattern) continue;

              try {
                const headers = new Headers({
                  ...(event.properties ?? {}),
                  ...(event.systemProperties ?? {}),
                });

                const body = typeof event.body === "string"
                  ? event.body
                  : JSON.stringify(event.body);

                const request = new Request(
                  new URL(
                    pattern.PatternText,
                    `https://eventhub/${processor.EventHubName}`,
                  ),
                  {
                    method: "POST",
                    body,
                    headers,
                  },
                );

                const ctx: EaCRuntimeContext = await this.buildContext(
                  ioc,
                  eac,
                  appProcCfg,
                );
                ctx.Runtime.URLMatch = buildURLMatch(pattern.Pattern, request);

                const response = await pattern.Handlers.Execute(request, ctx);

                logger.debug(
                  `✅ EH pattern executed: ${pattern.PatternText} (${response?.status})`,
                );
              } catch (err) {
                logger.error(`❌ Azure Event Hub event error`, err);
              }
            }
          },
          processError: async (err) => {
            logger.error("🔥 Azure Event Hub processing error", err);
          },
        });

        return async () => {
          const handledEvents = patterns.map(
            (p) => `${processor.EventHubName}:${p.PatternText}`,
          );
          return Response.json({ Events: handledEvents });
        };
      }
    })();
