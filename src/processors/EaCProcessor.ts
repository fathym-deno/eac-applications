/**
 * The base EaC processor type.
 */
export type EaCProcessor<TType extends string | undefined = string> = {
  /** The cache control headers for the processor. */
  CacheControl?: Record<string, string>;

  /** Indicates whether the processor should force a cache response. */
  ForceCache?: boolean;

  /** The type of processor. */
  Type: TType;
};

/**
 * Type Guard: Checks if the given object is an EaCProcessor.
 *
 * @param type The processor type.
 * @param proc The processor to check.
 * @returns true if the given processor is of the specified type, false otherwise.
 */
export function isEaCProcessor<TType extends string | undefined = string>(
  type: TType,
  proc: unknown,
): proc is EaCProcessor {
  const x = proc as EaCProcessor;

  return x && (!type || x.Type === type);
}
