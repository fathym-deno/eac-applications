import {
  EaCKeepAliveModifierDetails,
  EaCRuntimeHandler,
  establishKeepAliveMiddleware,
  isEaCKeepAliveModifierDetails,
  LoggingProvider,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCKeepAliveModifierHandlerResolver: ModifierHandlerResolver = {
  async Resolve(ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCKeepAliveModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        "The provided modifier is not supported for the EaCKeepAliveModifierHandlerResolver.",
      );
    }

    const details = modifier.Details as EaCKeepAliveModifierDetails;

    const logger = await ioc.Resolve(LoggingProvider);

    return establishKeepAliveMiddleware(logger.Package, details.KeepAlivePath);
  },
};
