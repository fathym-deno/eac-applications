import {
  EAC_RUNTIME_DEV,
  EaCProxyProcessor,
  isEaCProxyProcessor,
  proxyRequest,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

export const EaCProxyProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCProxyProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCProxyProcessorHandlerResolver.",
      );
    }

    const processor = appProcCfg.Application.Processor as EaCProxyProcessor;

    return Promise.resolve((req, ctx) => {
      return proxyRequest(
        req,
        processor.ProxyRoot,
        ctx.Runtime.URLMatch.Base,
        ctx.Runtime.URLMatch.Path,
        processor.Headers,
        ctx.Runtime.URLMatch.Search,
        ctx.Runtime.URLMatch.Hash,
        processor.RedirectMode,
        !EAC_RUNTIME_DEV() ? processor.CacheControl : undefined,
        processor.ForceCache,
        // ctx.Info.remoteAddr.hostname,
      );
    });
  },
};
