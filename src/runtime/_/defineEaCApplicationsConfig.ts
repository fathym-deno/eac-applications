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
    GenericEaCConfig(new EaCApplicationsRuntime(config as EaCRuntimeConfig)),
    {
      Plugins: [new FathymCorePlugin()],
    } as EaCRuntimeConfig,
    await config,
  );
}
