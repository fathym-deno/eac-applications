import {
  EaCRuntimeHandler,
  EaCTracingModifierDetails,
  establishTracingMiddleware,
  isEaCTracingModifierDetails,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCTracingModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCTracingModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        "The provided modifier is not supported for the EaCTracingModifierHandlerResolver.",
      );
    }

    const details = modifier.Details as EaCTracingModifierDetails;

    return Promise.resolve(
      establishTracingMiddleware(details.TraceRequest, details.TraceResponse),
    );
  },
};
