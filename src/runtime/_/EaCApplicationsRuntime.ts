import {
  buildURLMatch,
  EAC_RUNTIME_DEV,
  EaCApplicationAsCode,
  EaCApplicationProcessorConfig,
  EaCModifierAsCode,
  EaCModifierResolverConfiguration,
  EaCProjectAsCode,
  EaCProjectProcessorConfig,
  EaCRuntimeConfig,
  EaCRuntimeHandler,
  EaCRuntimeHandlerPipeline,
  EaCRuntimeHandlerRouteGroup,
  EverythingAsCode,
  EverythingAsCodeApplications,
  GenericEaCRuntime,
  isEverythingAsCodeApplications,
  merge,
  ModifierHandlerResolver,
  processCacheControlHeaders,
  ProcessorHandlerResolver,
} from "./.deps.ts";
import { EaCApplicationsRuntimeContext } from "./EaCApplicationsRuntimeContext.ts";

export class EaCApplicationsRuntime<
  TEaC extends
    & EverythingAsCode
    & EverythingAsCodeApplications =
      & EverythingAsCode
      & EverythingAsCodeApplications,
> extends GenericEaCRuntime<TEaC> {
  constructor(config: EaCRuntimeConfig<TEaC>) {
    super(config);
  }
}
