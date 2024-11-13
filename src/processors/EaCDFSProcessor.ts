import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The details of a DFS processor.
 */
export type EaCDFSProcessor = {
  /** The DFS lookup. */
  DFSLookup: string;
} & EaCProcessor<"DFS">;

/**
 * Type Guard: Checks if the given object is an EaCDFSProcessor.
 *
 * @param proc The DFS processor.
 * @returns true if the object is an EaCDFSProcessor, false otherwise.
 */
export function isEaCDFSProcessor(proc: unknown): proc is EaCDFSProcessor {
  const x = proc as EaCDFSProcessor;

  return (
    isEaCProcessor("DFS", x) &&
    x.DFSLookup !== undefined &&
    typeof x.DFSLookup === "string"
  );
}
