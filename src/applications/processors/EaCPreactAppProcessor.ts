import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The EaCPreact app processor.
 */
export type EaCPreactAppProcessor = {
  /** The app DFS lookup. */
  AppDFSLookup: string;

  // BundleDFSLookup?: string;

  /** Determines if the system will bypass base href logic. */
  BypassEaCBase?: boolean;

  /** The component DFS lookups for resolving Islands. */
  ComponentDFSLookups?: [string, string[]][];
} & EaCProcessor<"PreactApp">;

/**
 * Type Guard: Checks if the given object is an EaCPreactAppProcessor.
 *
 * @param proc The processor to check.
 * @returns true if the given processor is an EaCPreactAppProcessor, false otherwise.
 */
export function isEaCPreactAppProcessor(
  proc: unknown,
): proc is EaCPreactAppProcessor {
  const x = proc as EaCPreactAppProcessor;

  return (
    isEaCProcessor("PreactApp", x) &&
    x.AppDFSLookup !== undefined &&
    typeof x.AppDFSLookup === "string"
  );
}
