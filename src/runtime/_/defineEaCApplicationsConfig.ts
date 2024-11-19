import {
  EaCRuntimeConfig,
  FathymCorePlugin,
  GenericEaCConfig,
  mergeWithArrays,
} from "./.deps.ts";
import { EaCApplicationsRuntime } from "./EaCApplicationsRuntime.ts";

export async function defineEaCApplicationsConfig(
  config: Partial<EaCRuntimeConfig> | Promise<Partial<EaCRuntimeConfig>>,
): Promise<EaCRuntimeConfig> {
  return mergeWithArrays(
    GenericEaCConfig((cfg) => new EaCApplicationsRuntime(cfg)),
    {
      Plugins: [new FathymCorePlugin()],
    } as EaCRuntimeConfig,
    await config,
  );
}
