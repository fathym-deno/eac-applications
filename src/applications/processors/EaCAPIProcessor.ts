import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * An EaC API processor.
 */
export type EaCAPIProcessor = {
  /** The default content type for the API. */
  DefaultContentType?: string;

  /** The DFS lookup for the API's configuration. */
  DFSLookup: string;
} & EaCProcessor<"API">;

/**
 * Type Guard: Checks if the given object is an EaC API processor.
 *
 * @param proc The EaC API processor.
 * @returns true if the object is an EaC API processor, false otherwise.
 */
export function isEaCAPIProcessor(proc: unknown): proc is EaCAPIProcessor {
  const x = proc as EaCAPIProcessor;

  return (
    isEaCProcessor("API", x) &&
    x.DFSLookup !== undefined &&
    typeof x.DFSLookup === "string"
  );
}
