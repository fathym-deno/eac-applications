import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a MS App Insights modifier.
 */
export type EaCMSAppInsightsModifierDetails = {
  InstrumentationKey: string;
} & EaCModifierDetails<"MSAppInsights">;

/**
 * Type Guard: Checks if the given object is an EaC MS App Insights modifier details.
 *
 * @param details The details of a MS App Insights modifier.
 * @returns true if the object is an EaC MS App Insights modifier details, false otherwise.
 */
export function isEaCMSAppInsightsModifierDetails(
  details: unknown,
): details is EaCMSAppInsightsModifierDetails {
  const x = details as EaCMSAppInsightsModifierDetails;

  return (
    isEaCModifierDetails("MSAppInsights", x)
  );
}
