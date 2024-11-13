import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The tailwind processor.
 */
export type EaCTailwindProcessor = {
  /** The path to the autoprefixer options file. */
  AutoprefixerOptionsPath?: string;

  /** The path to the tailwind configuration file. */
  ConfigPath?: string;

  /** The DFS lookups to search for tailwind styles in. */
  DFSLookups: string[];

  /** The path to the tailwind styles template file. */
  StylesTemplatePath?: string;
} & EaCProcessor<"Tailwind">;

/**
 * Type Guard: Checks if the given object is an EaCTailwindProcessor.
 *
 * @param proc The tailwind processor.
 * @returns true if the given processor is a tailwind processor, false otherwise.
 */
export function isEaCTailwindProcessor(
  proc: unknown,
): proc is EaCTailwindProcessor {
  const x = proc as EaCTailwindProcessor;

  return isEaCProcessor("Tailwind", x) && Array.isArray(x.DFSLookups);
}
