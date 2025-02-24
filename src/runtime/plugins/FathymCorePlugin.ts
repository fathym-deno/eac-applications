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

    return Promise.resolve(pluginConfig);
  }
}
