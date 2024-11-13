import {
  EaCDetails,
  EaCModifierResolverConfiguration,
  EaCProcessor,
} from "./.deps.ts";
import {
  EaCApplicationDetails,
  isEaCApplicationDetails,
} from "./EaCApplicationDetails.ts";

/**
 * An EaC Application as Code.
 */
export type EaCApplicationAsCode = {
  /** The modifier resolver configuration for the application. */
  ModifierResolvers?: Record<string, EaCModifierResolverConfiguration>;

  /** The processor for the application. */
  Processor: EaCProcessor;
} & EaCDetails<EaCApplicationDetails>;

/**
 * Type Guard: Checks if the given object is an EaC Application as Code.
 *
 * @param eac The application.
 * @returns true if the object is an EaC Application as Code, false otherwise.
 */
export function isEaCApplicationAsCode(
  eac: unknown,
): eac is EaCApplicationAsCode {
  const app = eac as EaCApplicationAsCode;

  return (
    app &&
    app.Details !== undefined &&
    isEaCApplicationDetails(app.Details) &&
    app.Processor !== undefined
  );
}
