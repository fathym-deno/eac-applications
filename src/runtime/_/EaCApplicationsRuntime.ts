import {
  EaCRuntimeConfig,
  EverythingAsCode,
  EverythingAsCodeApplications,
  GenericEaCRuntime,
} from "./.deps.ts";

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
