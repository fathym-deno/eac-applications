import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The EaCOAuth processor.
 */
export type EaCOAuthProcessor = {
  /** The provider lookup for the OAuth provider. */
  ProviderLookup: string;
} & EaCProcessor<"OAuth">;

/**
 * Type Guard: Checks if the given object is an EaCOAuthProcessor.
 *
 * @param proc The processor to check.
 * @returns true if the given processor is an EaCOAuthProcessor, false otherwise.
 */
export function isEaCOAuthProcessor(proc: unknown): proc is EaCOAuthProcessor {
  const x = proc as EaCOAuthProcessor;

  return (
    isEaCProcessor("OAuth", x) &&
    x.ProviderLookup !== undefined &&
    typeof x.ProviderLookup === "string"
  );
}
