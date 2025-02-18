import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a Google Analytics modifier.
 */
export type EaCGoogleAnalyticsModifierDetails = EaCModifierDetails<"GoogleAnalytics">;

/**
 * Type Guard: Checks if the given object is an EaC Google Analyics modifier details.
 *
 * @param details The details of a Google Analytics modifier.
 * @returns true if the object is an EaC Google Analytics modifier details, false otherwise.
 */
export function isEaCGoogleAnalyticsModifierDetails(
  details: unknown,
): details is EaCGoogleAnalyticsModifierDetails {
  const x = details as EaCGoogleAnalyticsModifierDetails;

  return (
    isEaCModifierDetails("GoogleAnalytics", x)
  );
}
