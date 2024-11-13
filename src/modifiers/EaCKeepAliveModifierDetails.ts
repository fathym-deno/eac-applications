import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a keep-alive modifier.
 */
export type EaCKeepAliveModifierDetails = {
  /** The path the modifier will run on. */
  KeepAlivePath: string;
} & EaCModifierDetails<"KeepAlive">;

/**
 * Type Guard: Checks if the given object is an EaCKeepAliveModifierDetails.
 *
 * @param details The details of a keep-alive modifier.
 * @returns true if the object is an EaCKeepAliveModifierDetails, false otherwise.
 */
export function isEaCKeepAliveModifierDetails(
  details: unknown,
): details is EaCKeepAliveModifierDetails {
  const x = details as EaCKeepAliveModifierDetails;

  return (
    isEaCModifierDetails("KeepAlive", x) &&
    x.KeepAlivePath !== undefined &&
    typeof x.KeepAlivePath === "string"
  );
}
