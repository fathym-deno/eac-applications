import { EaCRuntimeConfig, GenericEaCConfig, merge } from "./.deps.ts";
import { EaCApplicationsRuntime } from "./EaCApplicationsRuntime.ts";

export async function defineEaCApplicationsConfig(
  config: Partial<EaCRuntimeConfig> | Promise<Partial<EaCRuntimeConfig>>,
): Promise<EaCRuntimeConfig> {
  return merge(
    GenericEaCConfig(new EaCApplicationsRuntime(config as EaCRuntimeConfig)),
    await config,
  );
}
