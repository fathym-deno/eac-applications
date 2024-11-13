import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a BaseHREF modifier.
 */
export type EaCBaseHREFModifierDetails = EaCModifierDetails<"BaseHREF">;

/**
 * Type Guard: Checks if the given object is an EaC BaseHREF modifier details.
 *
 * @param details The details of a BaseHREF modifier.
 * @returns true if the object is an EaC BaseHREF modifier details, false otherwise.
 */
export function isEaCBaseHREFModifierDetails(
  details: unknown,
): details is EaCBaseHREFModifierDetails {
  const x = details as EaCBaseHREFModifierDetails;

  return (
    isEaCModifierDetails("BaseHREF", x)
  );
}
