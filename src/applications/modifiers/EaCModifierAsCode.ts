import { EaCDetails } from "./.deps.ts";
import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The EaC node representing a modifier as code.
 */
export type EaCModifierAsCode = EaCDetails<EaCModifierDetails>;

/**
 * Type Guard: Checks if the given object is an EaCModifierAsCode.
 *
 * @param eac The EaC modifier as code.
 * @returns true if the object is an EaCModifierAsCode, false otherwise.
 */
export function isEaCModifierAsCode(eac: unknown): eac is EaCModifierAsCode {
  const mod = eac as EaCModifierAsCode;

  return (
    mod &&
    mod.Details !== undefined &&
    isEaCModifierDetails(undefined, mod.Details)
  );
}
