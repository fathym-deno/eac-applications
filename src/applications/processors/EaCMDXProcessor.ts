import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * An EaC MDX processor.
 */
export type EaCMDXProcessor = {
  /** The DFS lookup for locating MDX files. */
  DFSLookup: string;

  /** Optional path to the documentation site config file (defaults to: ./.config.ts). */
  ConfigPath?: string;
} & EaCProcessor<"MDX">;

/**
 * Type Guard: Checks if the given object is an EaC MDX processor.
 *
 * @param proc The EaC MDX processor.
 * @returns true if the object is an EaC MDX processor, false otherwise.
 */
export function isEaCMDXProcessor(proc: unknown): proc is EaCMDXProcessor {
  const x = proc as EaCMDXProcessor;

  return (
    isEaCProcessor("MDX", x) &&
    typeof x.DFSLookup === "string" &&
    (x.ConfigPath === undefined || typeof x.ConfigPath === "string")
  );
}
