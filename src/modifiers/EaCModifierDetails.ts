import { EaCVertexDetails } from "./.deps.ts";

/**
 * The base type for all EaC modifier details.
 */
export type EaCModifierDetails<TType extends string | undefined = string> = {
  /** The type of the modifier. */
  Type: TType;
} & EaCVertexDetails;

/**
 * Type Guard: Checks if the given object is an EaCModifierDetails.
 *
 * @param type The type of the modifier.
 * @param details The details of the modifier.
 * @returns true if the object is an EaCModifierDetails, false otherwise.
 */
export function isEaCModifierDetails<TType extends string | undefined = string>(
  type: TType,
  details: unknown,
): details is EaCModifierDetails {
  const x = details as EaCModifierDetails;

  return x && (!type || x.Type === type);
}
