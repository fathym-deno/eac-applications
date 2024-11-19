import {
  EaCAPIProcessor,
  EaCRuntimeHandlerSet,
  ESBuild,
  executePathMatch,
  isEaCAPIProcessor,
  loadEaCRuntimeHandlers,
  loadFileHandler,
  loadMiddleware,
  loadRequestPathPatterns,
  LoggingProvider,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

export const EaCAPIProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    const logger = (await ioc.Resolve(LoggingProvider)).Package;

    if (!isEaCAPIProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCAPIProcessorHandlerResolver.",
      );
    }

    const processor = appProcCfg.Application.Processor as EaCAPIProcessor;

    const dfs = eac.DFSs![processor.DFSLookup]!.Details!;

    const fileHandler = await loadFileHandler(ioc, dfs);

    const patterns = await loadRequestPathPatterns<{
      middleware: [string, EaCRuntimeHandlerSet][];
    }>(
      fileHandler!,
      dfs,
      async (allPaths) => {
        const middlewareLoader = async () => {
          const middlewarePaths = allPaths
            .filter((p) => p.endsWith("_middleware.ts"))
            .sort((a, b) => a.split("/").length - b.split("/").length);

          // debugger;
          const middlewareCalls = middlewarePaths.map((p) => {
            return loadMiddleware(
              logger,
              fileHandler!,
              p,
              dfs,
              processor.DFSLookup,
            );
          });

          return (await Promise.all(middlewareCalls))
            .filter((m) => m)
            .map((m) => m!);
        };

        const [middleware] = await Promise.all([middlewareLoader()]);

        logger.debug(`Middleware ${processor.DFSLookup}: `);
        logger.debug(middleware.map((m) => m));
        logger.debug("");

        return { middleware };
      },
      async (filePath) => {
        return await loadEaCRuntimeHandlers(
          logger,
          fileHandler!,
          filePath,
          dfs,
          processor.DFSLookup,
        );
      },
      (filePath, pipeline, { middleware }) => {
        const reqMiddleware = middleware
          .filter(([root]) => {
            return filePath.startsWith(root);
          })
          .flatMap(([_root, handler]) =>
            Array.isArray(handler) ? handler : [handler]
          );

        pipeline.Prepend(...reqMiddleware);
      },
      appProcCfg.Revision,
    ).then((patterns) => {
      logger.debug(`APIs ${processor.DFSLookup}: `);
      logger.debug(patterns.map((p) => p.PatternText));
      logger.debug("");

      return patterns;
    });

    return (req, ctx) => {
      return executePathMatch(patterns, req, ctx, processor.DefaultContentType);
    };
  },
};
