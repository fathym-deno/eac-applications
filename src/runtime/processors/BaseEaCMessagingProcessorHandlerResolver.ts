import {
  DFSFileHandler,
  EaCApplicationProcessorConfig,
  EaCRuntimeContext,
  EverythingAsCode,
  EverythingAsCodeDFS,
  IoCContainer,
  loadDFSFileHandler,
  loadEaCRuntimeHandlers,
  loadMiddleware,
  loadRequestPathPatterns,
  Logger,
  LoggingProvider,
  PathMatch,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";
import { BaseEaCMessagingProcessor } from "../../applications/processors/BaseEaCMessagingProcessor.ts";

/**
 * Structure returned by pattern loader.
 */
export type MessagingProcessorPatternLoad = {
  fileHandler: DFSFileHandler;

  patterns: PathMatch[];
};

/**
 * Base class to handle shared messaging processor setup (DFS, middleware, handlers).
 */
export abstract class BaseEaCMessagingProcessorHandlerResolver<
  TProcessor extends BaseEaCMessagingProcessor<string>,
> implements ProcessorHandlerResolver {
  /**
   * Implement this in subclasses.
   * Responsible for full resolution and processor wiring.
   */
  public abstract Resolve(
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: EverythingAsCode & EverythingAsCodeDFS,
  ): Promise<(req: Request, ctx: unknown) => Promise<Response>>;

  /**
   * Dynamically loads middleware + impulse handlers for this processor.
   */
  protected async loadPatterns(
    processor: TProcessor,
    ioc: IoCContainer,
    eac: EverythingAsCode & EverythingAsCodeDFS,
    appProcCfg: EaCApplicationProcessorConfig,
    logger: Logger,
  ): Promise<MessagingProcessorPatternLoad> {
    const fileHandler = await loadDFSFileHandler(
      ioc,
      eac.DFSs!,
      eac.$GlobalOptions?.DFSs ?? {},
      processor.DFSLookup,
    );

    if (!fileHandler) {
      throw new Error(
        `❌ Failed to load DFS handler for ${processor.DFSLookup}`,
      );
    }

    const dfs = eac.DFSs![processor.DFSLookup]!.Details!;

    const patterns = await loadRequestPathPatterns(
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
            .filter(Boolean)
            .map((m) => m!);
        };

        const [middleware] = await Promise.all([middlewareLoader()]);

        return { middleware };
      },
      async (filePath) =>
        await loadEaCRuntimeHandlers(
          logger,
          fileHandler,
          filePath,
          dfs,
          processor.DFSLookup,
        ),
      (filePath, pipeline, { middleware }) => {
        const applicableMiddleware = middleware
          .filter(([root]) => filePath.startsWith(root))
          .flatMap(([_root, handler]) =>
            Array.isArray(handler) ? handler : [handler]
          );

        pipeline.Prepend(...applicableMiddleware);
      },
      appProcCfg.Revision,
    );

    return { fileHandler, patterns };
  }

  /**
   * Constructs the runtime context for request execution.
   */
  protected async buildContext(
    ioc: IoCContainer,
    eac: EverythingAsCode,
    appProcCfg: EaCApplicationProcessorConfig,
    contextOverrides?: Partial<
      Pick<EaCRuntimeContext, "Params" | "State" | "Data">
    >,
  ): Promise<EaCRuntimeContext> {
    return {
      Data: contextOverrides?.Data ?? {},
      Runtime: {
        EaC: eac,
        IoC: ioc,
        Logs: await ioc.Resolve<LoggingProvider>(LoggingProvider),
        Revision: appProcCfg.Revision,
      },
      Params: contextOverrides?.Params ?? {},
      State: contextOverrides?.State ?? {},
    } as EaCRuntimeContext;
  }
}
