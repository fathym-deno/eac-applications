import {
  EaCDenoKVCacheModifierDetails,
  EaCRuntimeHandler,
  establishDenoKvCacheMiddleware,
  isEaCDenoKVCacheModifierDetails,
  LoggingProvider,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCDenoKVCacheModifierHandlerResolver: ModifierHandlerResolver = {
  async Resolve(ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCDenoKVCacheModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        "The provided modifier is not supported for the EaCDenoKVCacheModifierHandlerResolver.",
      );
    }

    const details = modifier.Details as EaCDenoKVCacheModifierDetails;

    const logger = await ioc.Resolve(LoggingProvider);

    return establishDenoKvCacheMiddleware(
      logger.Package,
      details.DenoKVDatabaseLookup,
      details.CacheSeconds,
      details.PathFilterRegex,
    );
  },
};
