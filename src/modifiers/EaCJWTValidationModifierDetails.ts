import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a JWT validation modifier.
 */
export type EaCJWTValidationModifierDetails = EaCModifierDetails<
  "JWTValidation"
>;

/**
 * Type Guard: Checks if the given object is an EaCJWTValidationModifierDetails.
 *
 * @param details The details of a JWT validation modifier.
 * @returns true if the object is an EaCJWTValidationModifierDetails, false otherwise.
 */
export function isEaCJWTValidationModifierDetails(
  details: unknown,
): details is EaCJWTValidationModifierDetails {
  const x = details as EaCJWTValidationModifierDetails;

  return isEaCModifierDetails("JWTValidation", x);
}
