import { EaCModifierAsCode, EverythingAsCodeDFS } from "./.deps.ts";
import { EaCApplicationAsCode } from "./EaCApplicationAsCode.ts";
import { EaCProjectAsCode } from "./EaCProjectAsCode.ts";

/**
 * The Everything As Code (EaC) applications graph.
 */
export type EverythingAsCodeApplications = {
  /** The applications for the EaC. */
  Applications?: Record<string, EaCApplicationAsCode>;

  /** The modifiers for the EaC. */
  Modifiers?: Record<string, EaCModifierAsCode>;

  /** The projects for the EaC. */
  Projects?: Record<string, EaCProjectAsCode>;
} & EverythingAsCodeDFS;

/**
 * Type Guard: Checks if the given object is an EverythingAsCodeApplications.
 *
 * @param eac Everything As Code Applications to check.
 * @returns true if the given EaC is Everything As Code Applications, false otherwise.
 */
export function isEverythingAsCodeApplications(
  eac: unknown,
): eac is EverythingAsCodeApplications {
  const sourcesEaC = eac as EverythingAsCodeApplications;

  return (
    sourcesEaC.Applications !== undefined && sourcesEaC.Projects !== undefined
  );
}
