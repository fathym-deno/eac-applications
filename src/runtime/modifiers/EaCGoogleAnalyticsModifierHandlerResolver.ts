import {
  EaCGoogleAnalyticsModifierDetails,
  EaCRuntimeHandler,
  establishGoogleAnalyticsMiddleware,
  isEaCGoogleAnalyticsModifierDetails,
  LoggingProvider,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCGoogleAnalyticsModifierHandlerResolver: ModifierHandlerResolver = {
  async Resolve(ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCGoogleAnalyticsModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        "The provided modifier is not supported for the EaCGoogleAnalyticsModifierHandlerResolver.",
      );
    }

    const _details = modifier.Details as EaCGoogleAnalyticsModifierDetails;

    const logger = await ioc.Resolve(LoggingProvider);

    return establishGoogleAnalyticsMiddleware(logger.Package);
  },
};
