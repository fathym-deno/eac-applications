import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a Google Tag Manager modifier.
 */
export type EaCGoogleTagMgrModifierDetails = EaCModifierDetails<"GoogleTagMgr">;

/**
 * Type Guard: Checks if the given object is an EaC Google Tag Manager modifier details.
 *
 * @param details The details of a Google Tag Manager modifier.
 * @returns true if the object is an EaC Google Tag Manager modifier details, false otherwise.
 */
export function isEaCGoogleTagMgrModifierDetails(
  details: unknown,
): details is EaCGoogleTagMgrModifierDetails {
  const x = details as EaCGoogleTagMgrModifierDetails;

  return (
    isEaCModifierDetails("GoogleTagMgr", x)
  );
}
