import { EaCVertexDetails } from "./.deps.ts";

/**
 * The details of an EaC application.
 */
export type EaCApplicationDetails = EaCVertexDetails;

/**
 * Type Guard: Checks if the given object is an EaC application details.
 *
 * @param details The details of an EaC application.
 * @returns true if the object is an EaC application details, false otherwise.
 */
export function isEaCApplicationDetails(
  details: unknown,
): details is EaCApplicationDetails {
  const appDetails = details as EaCApplicationDetails;

  return !!appDetails;
}
