import { EaCVertexDetails } from "./.deps.ts";

/**
 * The project details.
 */
export type EaCProjectDetails = {
  /** The favicon URL of the project. */
  Favicon?: string;

  /** The priority of the project. */
  Priority: number;
} & EaCVertexDetails;

/**
 * Type Guard: Checks if the given object is an EaCProjectDetails.
 *
 * @param details The project details.
 * @returns true if the given details are valid project details, false otherwise.
 */
export function isEaCProjectDetails(
  details: unknown,
): details is EaCProjectDetails {
  const projDetails = details as EaCProjectDetails;

  return !!projDetails;
}
