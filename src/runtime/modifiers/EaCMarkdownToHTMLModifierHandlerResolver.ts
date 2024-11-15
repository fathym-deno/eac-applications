import {
  EaCMarkdownToHTMLModifierDetails,
  EaCRuntimeHandler,
  establishMarkdownToHTMLMiddleware,
  isEaCMarkdownToHTMLModifierDetails,
} from "./.deps.ts";
import { ModifierHandlerResolver } from "./ModifierHandlerResolver.ts";

export const EaCMarkdownToHTMLModifierHandlerResolver: ModifierHandlerResolver =
  {
    Resolve(_ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
      if (!isEaCMarkdownToHTMLModifierDetails(modifier.Details)) {
        throw new Deno.errors.NotSupported(
          "The provided modifier is not supported for the EaCMarkdownModifierHandlerResolver.",
        );
      }

      const _details = modifier.Details as EaCMarkdownToHTMLModifierDetails;

      return Promise.resolve(establishMarkdownToHTMLMiddleware());
    },
  };
