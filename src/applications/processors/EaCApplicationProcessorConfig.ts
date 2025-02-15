import {
  EaCApplicationAsCode,
  EaCApplicationResolverConfiguration,
  EaCRuntimeHandlerPipeline,
} from "./.deps.ts";

export type EaCApplicationProcessorConfig = {
  ApplicationLookup: string;

  Application: EaCApplicationAsCode;

  Handler: EaCRuntimeHandlerPipeline;

  // Pattern: URLPattern;

  ResolverConfig: EaCApplicationResolverConfiguration;

  Revision: string;
};
