import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The proxy processor.
 */
export type EaCDenoLSPProcessor = {} & EaCProcessor<"DenoLSP">;

/**
 * Type Guard: Checks if the given object is an EaCDenoLSPProcessor.
 *
 * @param proc The proxy processor.
 * @returns true if the given processor is a proxy processor, false otherwise.
 */
export function isEaCDenoLSPProcessor(
  proc: unknown,
): proc is EaCDenoLSPProcessor {
  const x = proc as EaCDenoLSPProcessor;

  return (
    isEaCProcessor("DenoLSP", x)
  );
}
