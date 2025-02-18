import {
  EaCMSAppInsightsModifierDetails,
  EaCRuntimeHandler,
  establishMSAppInsightsMiddleware,
  isEaCMSAppInsightsModifierDetails,
  LoggingProvider,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCMSAppInsightsModifierHandlerResolver: ModifierHandlerResolver = {
  async Resolve(ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCMSAppInsightsModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        "The provided modifier is not supported for the EaCMSAppInsightsModifierHandlerResolver.",
      );
    }

    const _details = modifier.Details as EaCMSAppInsightsModifierDetails;

    const logger = await ioc.Resolve(LoggingProvider);

    return establishMSAppInsightsMiddleware(logger.Package);
  },
};
