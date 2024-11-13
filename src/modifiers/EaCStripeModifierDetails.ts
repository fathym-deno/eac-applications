import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a Stripe modifier.
 */
export type EaCStripeModifierDetails = {
  /** The license lookup for the Stripe modifier. */
  LicenseLookup: string;

  /** Indicates whether the script should be included in the output. */
  IncludeScript: boolean;
} & EaCModifierDetails<"Stripe">;

/**
 * Type Guard: Checks if the given object is an EaCStripeModifierDetails.
 *
 * @param details The details of a Stripe modifier.
 * @returns true if the given details are a valid Stripe modifier details, false otherwise.
 */
export function isEaCStripeModifierDetails(
  details: unknown,
): details is EaCStripeModifierDetails {
  const x = details as EaCStripeModifierDetails;

  return (
    isEaCModifierDetails("Stripe", x) &&
    x.IncludeScript !== undefined &&
    typeof x.IncludeScript === "boolean"
  );
}
