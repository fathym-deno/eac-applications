import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a DenoKV cache modifier.
 */
export type EaCDenoKVCacheModifierDetails = {
  /** The cache duration in seconds. */
  CacheSeconds: number;

  /** The DenoKV database lookup. */
  DenoKVDatabaseLookup: string;

  /** The optional path filter regular expression. */
  PathFilterRegex?: string;
} & EaCModifierDetails<"DenoKVCache">;

/**
 * Type Guard: Checks if the given object is an EaCDenoKVCache modifier.
 *
 * @param details The details of a DenoKV cache modifier.
 * @returns true if the object is an EaCDenoKVCache modifier details, false otherwise.
 */
export function isEaCDenoKVCacheModifierDetails(
  details: unknown,
): details is EaCDenoKVCacheModifierDetails {
  const x = details as EaCDenoKVCacheModifierDetails;

  return (
    isEaCModifierDetails("DenoKVCache", x) &&
    x.CacheSeconds !== undefined &&
    typeof x.CacheSeconds === "number" &&
    x.DenoKVDatabaseLookup !== undefined &&
    typeof x.DenoKVDatabaseLookup === "string"
  );
}
