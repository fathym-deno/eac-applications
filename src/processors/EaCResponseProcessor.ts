import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The response processor.
 */
export type EaCResponseProcessor = {
  /** The body of the response. */
  Body: string;

  /** The headers of the response. */
  Headers?: Record<string, string>;

  /** The status code of the response. */
  Status: number;
} & EaCProcessor<"Response">;

/**
 * Type Guard: Checks if the given object is an EaCResponseProcessor.
 *
 * @param proc The response processor.
 * @returns true if the given processor is a response processor, false otherwise.
 */
export function isEaCResponseProcessor(
  proc: unknown,
): proc is EaCResponseProcessor {
  const x = proc as EaCResponseProcessor;

  return (
    isEaCProcessor("Response", x) &&
    x.Body !== undefined &&
    typeof x.Body === "string" &&
    x.Status !== undefined &&
    typeof x.Status === "number"
  );
}
