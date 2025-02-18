import {
  DefaultModifierMiddlewareResolver,
  EaCBaseHREFModifierHandlerResolver,
  EaCDenoKVCacheModifierHandlerResolver,
  EaCJWTValidationModifierHandlerResolver,
  EaCKeepAliveModifierHandlerResolver,
  EaCMarkdownToHTMLModifierHandlerResolver,
  EaCOAuthModifierHandlerResolver,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EaCStripeModifierHandlerResolver,
  EaCTracingModifierHandlerResolver,
  IoCContainer,
} from "./.deps.ts";

export default class FathymModifierHandlerPlugin implements EaCRuntimePlugin {
  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: FathymModifierHandlerPlugin.name,
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(DefaultModifierMiddlewareResolver, {
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCBaseHREFModifierHandlerResolver, {
      Name: "EaCBaseHREFModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCDenoKVCacheModifierHandlerResolver, {
      Name: "EaCDenoKVCacheModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCGoogleAnalyticsModifierHandlerResolver, {
      Name: "EaCGoogleAnalyticsModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCJWTValidationModifierHandlerResolver, {
      Name: "EaCJWTValidationModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCKeepAliveModifierHandlerResolver, {
      Name: "EaCKeepAliveModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCMarkdownToHTMLModifierHandlerResolver, {
      Name: "EaCMarkdownToHTMLModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCMSAppInsightsModifierHandlerResolver, {
      Name: "EaCMSAppInsightsModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCOAuthModifierHandlerResolver, {
      Name: "EaCOAuthModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCStripeModifierHandlerResolver, {
      Name: "EaCStripeModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => EaCTracingModifierHandlerResolver, {
      Name: "EaCTracingModifierDetails",
      Type: pluginConfig.IoC!.Symbol("ModifierHandlerResolver"),
    });

    return Promise.resolve(pluginConfig);
  }
}
