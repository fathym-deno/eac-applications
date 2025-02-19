import {
  EaCGoogleTagMgrModifierDetails,
  EaCRuntimeHandler,
  establishGoogleTagMgrMiddleware,
  isEaCGoogleTagMgrModifierDetails,
  LoggingProvider,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCGoogleTagMgrModifierHandlerResolver: ModifierHandlerResolver = {
  async Resolve(ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCGoogleTagMgrModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        "The provided modifier is not supported for the EaCGoogleTagMgrModifierHandlerResolver.",
      );
    }

    const _details = modifier.Details as EaCGoogleTagMgrModifierDetails;

    const logger = await ioc.Resolve(LoggingProvider);

    return establishGoogleTagMgrMiddleware(logger.Package, _details.GoogleID);
  },
};
