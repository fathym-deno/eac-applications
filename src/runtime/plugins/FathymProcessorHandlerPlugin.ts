import {
  DefaultProcessorHandlerResolver,
  EaCAPIProcessorHandlerResolver,
  EaCDFSProcessorHandlerResolver,
  EaCOAuthProcessorHandlerResolver,
  EaCPreactAppProcessorHandlerResolver,
  EaCProxyProcessorHandlerResolver,
  EaCRedirectProcessorHandlerResolver,
  EaCResponseProcessorHandlerResolver,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EaCStripeProcessorHandlerResolver,
  EaCTailwindProcessorHandlerResolver,
  IoCContainer,
  UnknownEaCProcessorHandlerResolver,
} from "./.deps.ts";

export default class FathymProcessorHandlerPlugin implements EaCRuntimePlugin {
  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: FathymProcessorHandlerPlugin.name,
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(DefaultProcessorHandlerResolver, {
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCAPIProcessorHandlerResolver, {
      Name: "EaCAPIProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCDFSProcessorHandlerResolver, {
      Name: "EaCDFSProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCOAuthProcessorHandlerResolver, {
      Name: "EaCOAuthProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCPreactAppProcessorHandlerResolver, {
      Name: "EaCPreactAppProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCProxyProcessorHandlerResolver, {
      Name: "EaCProxyProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCRedirectProcessorHandlerResolver, {
      Name: "EaCRedirectProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCResponseProcessorHandlerResolver, {
      Name: "EaCResponseProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCStripeProcessorHandlerResolver, {
      Name: "EaCStripeProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCTailwindProcessorHandlerResolver, {
      Name: "EaCTailwindProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => UnknownEaCProcessorHandlerResolver, {
      Name: "UnknownEaCProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    return Promise.resolve(pluginConfig);
  }
}
