import {
  EaCJWTValidationModifierDetails,
  EaCRuntimeHandler,
  establishJwtValidationMiddleware,
  IS_BUILDING,
  isEaCJWTValidationModifierDetails,
  loadJwtConfig,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCJWTValidationModifierHandlerResolver: ModifierHandlerResolver =
  {
    Resolve(_ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
      if (IS_BUILDING) {
        return Promise.resolve(undefined);
      }

      if (!isEaCJWTValidationModifierDetails(modifier.Details)) {
        throw new Deno.errors.NotSupported(
          "The provided modifier is not supported for the EaCJWTValidationModifierHandlerResolver.",
        );
      }

      const _details = modifier.Details as EaCJWTValidationModifierDetails;

      debugger;
      return Promise.resolve(establishJwtValidationMiddleware(loadJwtConfig()));
    },
  };
