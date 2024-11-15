import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The redirect processor.
 */
export type EaCRedirectProcessor = {
  /** Indicates whether the redirect is permanent. */
  Permanent: boolean;

  /** Indicates whether the method of the original request should be preserved. */
  PreserveMethod: boolean;

  /** The URL to redirect to. */
  Redirect: string;
} & EaCProcessor<"Redirect">;

/**
 * Type Guard: Checks if the given object is an EaCRedirectProcessor.
 *
 * @param proc The redirect processor.
 * @returns true if the given processor is a redirect processor, false otherwise.
 */
export function isEaCRedirectProcessor(
  proc: unknown,
): proc is EaCRedirectProcessor {
  const x = proc as EaCRedirectProcessor;

  return (
    isEaCProcessor("Redirect", x) &&
    x.Redirect !== undefined &&
    typeof x.Redirect === "string"
  );
}
