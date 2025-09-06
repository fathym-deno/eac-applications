import {
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EverythingAsCode,
  IoCContainer,
} from "./.deps.ts";
import FathymEaCDenoKVPlugin from "./FathymEaCDenoKVPlugin.ts";
import FathymDFSFileHandlerPlugin from "./FathymDFSFileHandlerPlugin.ts";
import FathymModifierHandlerPlugin from "./FathymModifierHandlerPlugin.ts";
import FathymProcessorHandlerPlugin from "./FathymProcessorHandlerPlugin.ts";
import FathymEaCPlugin from "./FathymEaCPlugin.ts";
import FathymAzureContainerCheckPlugin from "./azure/FathymAzureContainerCheckPlugin.ts";
import FathymEaCApplicationsPlugin from "./FathymEaCApplicationsPlugin.ts";
import { RuntimeHost } from "../refresh/RuntimeHost.ts";
import { RuntimeBuilder } from "../refresh/RuntimeBuilder.ts";
import { EaCRefreshController } from "../refresh/EaCRefreshController.ts";
import { EaCSource } from "../refresh/EaCSource.ts";

export default class FathymCorePlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: FathymCorePlugin.name,
      IoC: new IoCContainer(),
      Plugins: [
        new FathymAzureContainerCheckPlugin(),
        new FathymEaCPlugin(),
        new FathymProcessorHandlerPlugin(),
        new FathymModifierHandlerPlugin(),
        new FathymDFSFileHandlerPlugin(),
        new FathymEaCDenoKVPlugin(),
        new FathymEaCApplicationsPlugin(),
      ],
    };

    // Register the hot-swap components into the root IoC
    // Host holds the active route graph and dispatch handler
    pluginConfig.IoC!.Register(RuntimeHost, () => new RuntimeHost());

    // Source fetches EaC from the Steward service
    pluginConfig.IoC!.Register(EaCSource, () => new EaCSource());

    // Builder reconstructs route graph from EaC using this runtime's plugin stack
    pluginConfig.IoC!.Register(
      RuntimeBuilder,
      () => new RuntimeBuilder(_config),
    );

    // Controller orchestrates refresh and swap
    pluginConfig.IoC!.Register(
      EaCRefreshController,
      async (ioc: IoCContainer) =>
        new EaCRefreshController(
          _config,
          await ioc.Resolve(EaCSource),
          await ioc.Resolve(RuntimeBuilder),
          await ioc.Resolve(RuntimeHost),
          await _config.LoggingProvider!,
        ),
    );

    return Promise.resolve(pluginConfig);
  }
}
