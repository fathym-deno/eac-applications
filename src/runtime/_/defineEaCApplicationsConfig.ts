import {
  EaCApplicationsLoggingProvider,
  EaCRuntimeConfig,
  FathymCorePlugin,
  GenericEaCConfig,
  LoggingProvider,
  mergeWithArrays,
} from "./.deps.ts";
import { EaCApplicationsRuntime } from "./EaCApplicationsRuntime.ts";

export async function defineEaCApplicationsConfig(
  config: Partial<EaCRuntimeConfig> | Promise<Partial<EaCRuntimeConfig>>,
  loggingProvider: LoggingProvider = new EaCApplicationsLoggingProvider(),
): Promise<EaCRuntimeConfig> {
  return mergeWithArrays(
    GenericEaCConfig((cfg) => new EaCApplicationsRuntime(cfg), loggingProvider),
    {
      Plugins: [new FathymCorePlugin()],
    } as EaCRuntimeConfig,
    await config,
  );
}
