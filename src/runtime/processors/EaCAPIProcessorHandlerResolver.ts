import {
  EaCAPIProcessor,
  EaCRuntimeHandlerSet,
  ESBuild,
  executePathMatch,
  isEaCAPIProcessor,
  loadDFSFileHandler,
  loadEaCRuntimeHandlers,
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

    try {
      const fileHandler = await loadDFSFileHandler(
        ioc,
        eac.DFSs!,
        eac.$GlobalOptions?.DFSs ?? {},
        processor.DFSLookup,
      );

      const dfs = eac.DFSs![processor.DFSLookup]!.Details!;

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

          if (middleware?.length) {
            logger.debug(`Middleware - ${processor.DFSLookup}: `);
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
        if (patterns?.length) {
          logger.debug(`APIs - ${processor.DFSLookup}: `);
          patterns
            .map((p) => p.PatternText)
            .map(
              (pt) =>
                `${
                  appProcCfg.ResolverConfig.PathPattern.replace("*", "")
                }${pt}`,
            )
            .forEach((pt) => logger.debug(`\t${pt}`));
          logger.debug("");
        }

        return patterns;
      });

      return (req, ctx) => {
        return executePathMatch(
          patterns,
          req,
          ctx,
          processor.DefaultContentType,
        );
      };
    } catch (err) {
      if (err instanceof Error) {
        logger.error(
          `Error processing ${appProcCfg.ApplicationLookup} API processor: ${err.message}`,
        );
      }

      throw err;
    }
  },
};
