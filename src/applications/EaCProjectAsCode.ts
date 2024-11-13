import { type EaCDetails, EaCModifierResolverConfiguration } from "./.deps.ts";
import { EaCProjectDetails, isEaCProjectDetails } from "./EaCProjectDetails.ts";
import { EaCApplicationResolverConfiguration } from "./EaCApplicationResolverConfiguration.ts";
import { EaCProjectResolverConfiguration } from "./EaCProjectResolverConfiguration.ts";

/**
 * The EaC project as code configuration.
 */
export type EaCProjectAsCode = {
  /** The application resolvers for the project. */
  ApplicationResolvers: Record<string, EaCApplicationResolverConfiguration>;

  /** The modifier resolvers for the project. */
  ModifierResolvers?: Record<string, EaCModifierResolverConfiguration>;

  /** The project resolver configurations. */
  ResolverConfigs: Record<string, EaCProjectResolverConfiguration>;
} & EaCDetails<EaCProjectDetails>;

/**
 * Type Guard: Checks if the given object is an EaCProjectAsCode.
 *
 * @param eac The EaC project as code configuration to check.
 * @returns true if the given EaC project as code configuration is valid, false otherwise.
 */
export function isEaCProjectAsCode(eac: unknown): eac is EaCProjectAsCode {
  const proj = eac as EaCProjectAsCode;

  return (
    proj &&
    proj.Details !== undefined &&
    isEaCProjectDetails(proj.Details) &&
    proj.ApplicationResolvers !== undefined &&
    proj.ResolverConfigs !== undefined
  );
}
