import {
  EaCDFSProcessor,
  isEaCDFSProcessor,
  loadDFSFileHandler,
  mime,
  STATUS_CODE,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

export const EaCDFSProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCDFSProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCDFSProcessorHandlerResolver.",
      );
    }

    const processor = appProcCfg.Application.Processor as EaCDFSProcessor;

    const fileHandler = await loadDFSFileHandler(
      ioc,
      eac.DFSs!,
      eac.$GlobalOptions?.DFSs ?? {},
      processor.DFSLookup,
    );

    const dfs = eac.DFSs![processor.DFSLookup]!.Details!;

    const cacheDb = dfs.CacheDBLookup
      ? await ioc.Resolve(Deno.Kv, dfs.CacheDBLookup)
      : undefined;

    return async (_req, ctx) => {
      const filePath = ctx.Runtime.URLMatch.Path;

      const file = await fileHandler!.GetFileInfo(
        filePath,
        ctx.Runtime.Revision,
        dfs.DefaultFile,
        dfs.Extensions,
        dfs.UseCascading,
        cacheDb,
        dfs.CacheSeconds,
      );

      if (
        file &&
        (!file.Headers ||
          !("content-type" in file.Headers) ||
          !("Content-Type" in file.Headers))
      ) {
        const mimeType = file.Path.endsWith(".ts")
          ? "application/typescript"
          : mime.getType(file.Path);

        // if (!mimeType) {
        //   mimeType = processor.DFS.DefaultFile?.endsWith('.ts')
        //     ? 'application/typescript'
        //     : mime.getType(processor.DFS.DefaultFile || '');
        // }

        if (mimeType) {
          file.Headers = {
            ...(file.Headers || {}),
            "Content-Type": mimeType,
          };
        }
      }

      if (file) {
        const resp = new Response(file.Contents, {
          headers: file.Headers,
        });

        return resp;
      } else {
        return new Response(null, {
          status: STATUS_CODE.NotFound,
        });
      }
    };
  },
};
