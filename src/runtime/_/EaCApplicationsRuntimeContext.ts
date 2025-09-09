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
    /** Effective access rights for this request (context-level). */
    AccessRights?: string[];
  } & EaCRuntimeContext<TState, TData, TEaC>["Runtime"];
  /** Helper to check rights from handlers/pipeline. */
  HasAccessRights?: (
    required: string[],
    matchAll?: boolean,
  ) => Promise<boolean>;
} & Omit<EaCRuntimeContext<TState, TData, TEaC>, "Runtime">;
