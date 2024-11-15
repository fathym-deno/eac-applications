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

export default class FathymCorePlugin implements EaCRuntimePlugin {
  constructor(
    protected loadEaC: (eacApiKey: string) => Promise<EverythingAsCode>,
  ) {}

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: "FathymCorePlugin",
      IoC: new IoCContainer(),
      Plugins: [
        new FathymAzureContainerCheckPlugin(),
        new FathymProcessorHandlerPlugin(),
        new FathymModifierHandlerPlugin(),
        new FathymDFSFileHandlerPlugin(),
        new FathymEaCPlugin(this.loadEaC),
        new FathymEaCDenoKVPlugin(),
      ],
    };

    return Promise.resolve(pluginConfig);
  }
}
