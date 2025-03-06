import { EaCApplicationProcessorConfig } from "../applications/processors/.exports.ts";
import {
  EaCPreactAppProcessor,
  EaCRuntimeHandler,
  EverythingAsCodeDFS,
  IoCContainer,
  LoggingProvider,
  preactOptions,
} from "./.deps.ts";
import { EaCPreactAppHandler } from "./EaCPreactAppHandler.ts";
import { PreactRenderHandler } from "./PreactRenderHandler.ts";

export async function establishPreactAppHandler(
  ioc: IoCContainer,
  appProcCfg: EaCApplicationProcessorConfig,
  eac: EverythingAsCodeDFS,
): Promise<EaCRuntimeHandler> {
  const logger = await ioc.Resolve(LoggingProvider);

  const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

  const handler = new EaCPreactAppHandler(
    ioc,
    (await ioc.Resolve(LoggingProvider)).Package,
    new PreactRenderHandler(preactOptions, processor.BypassEaCBase),
    `./islands/client/eacIslandsClient.ts`,
    `./islands/client/client.deps.ts`,
    undefined,
    {
      outdir: Deno.cwd(),
    },
  );

  await handler.Configure(
    appProcCfg,
    eac.DFSs || {},
    eac.$GlobalOptions?.DFSs ?? {},
    Date.now().toString(),
  );

  await handler.Build(processor, {}, {});

  return (req, ctx) => {
    return handler.Execute(processor, req, ctx);
  };
}
