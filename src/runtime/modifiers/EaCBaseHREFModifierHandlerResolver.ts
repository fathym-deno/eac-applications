import {
  EaCBaseHREFModifierDetails,
  EaCRuntimeHandler,
  establishBaseHrefMiddleware,
  isEaCBaseHREFModifierDetails,
  LoggingProvider,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCBaseHREFModifierHandlerResolver: ModifierHandlerResolver = {
  async Resolve(ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCBaseHREFModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        "The provided modifier is not supported for the EaCBaseHREFModifierHandlerResolver.",
      );
    }

    const _details = modifier.Details as EaCBaseHREFModifierDetails;

    const logger = await ioc.Resolve(LoggingProvider);

    return establishBaseHrefMiddleware(logger.Package);
  },
};
