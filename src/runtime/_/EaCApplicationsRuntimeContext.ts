import {
  EaCApplicationProcessorConfig,
  EaCProjectProcessorConfig,
  EaCRuntimeContext,
  EverythingAsCode,
  EverythingAsCodeApplications,
} from "./.deps.ts";

export type EaCApplicationsRuntimeContext<
  TState = Record<string, unknown>,
  TData = Record<string, unknown>,
  TEaC extends
    & EverythingAsCode
    & EverythingAsCodeApplications =
      & EverythingAsCode
      & EverythingAsCodeApplications,
> = {
  Runtime: {
    ApplicationProcessorConfig: EaCApplicationProcessorConfig;

    ProjectProcessorConfig: EaCProjectProcessorConfig;
  } & EaCRuntimeContext<TState, TData, TEaC>["Runtime"];
} & Omit<EaCRuntimeContext<TState, TData, TEaC>, "Runtime">;
