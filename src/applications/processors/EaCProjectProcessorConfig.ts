import { EaCProjectAsCode, EaCRuntimeHandler } from "./.deps.ts";

export type EaCProjectProcessorConfig = {
  Handler: EaCRuntimeHandler;

  Patterns: URLPattern[];

  ProjectLookup: string;

  Project: EaCProjectAsCode;
};
