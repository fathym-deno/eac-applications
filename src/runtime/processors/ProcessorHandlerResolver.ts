import {
  EaCApplicationProcessorConfig,
  EaCRuntimeHandler,
  EverythingAsCode,
  EverythingAsCodeApplications,
  IoCContainer,
} from "./.deps.ts";

export type ProcessorHandlerResolver<
  TEaC extends
    & EverythingAsCode
    & EverythingAsCodeApplications =
      & EverythingAsCode
      & EverythingAsCodeApplications,
> = {
  Resolve: (
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: TEaC,
  ) => Promise<EaCRuntimeHandler | undefined>;
};
