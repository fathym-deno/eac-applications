import {
  DefaultDFSFileHandlerResolver,
  EaCAzureBlobStorageDistributedFileSystemHandlerResolver,
  EaCDenoKVDistributedFileSystemHandlerResolver,
  EaCESMDistributedFileSystemHandlerResolver,
  EaCJSRDistributedFileSystemHandlerResolver,
  EaCLocalDistributedFileSystemHandlerResolver,
  EaCNPMDistributedFileSystemHandlerResolver,
  EaCRemoteDistributedFileSystemHandlerResolver,
  type EaCRuntimeConfig,
  type EaCRuntimeHandlerRouteGroup,
  EaCWorkerDistributedFileSystemHandlerResolver,
  type EverythingAsCode,
  IoCContainer,
  LoggingProvider,
  UnknownEaCDistributedFileSystemHandlerResolver,
} from "./.deps.ts";
import FathymEaCDenoKVPlugin from "../plugins/FathymEaCDenoKVPlugin.ts";
import FathymEaCApplicationsPlugin from "../plugins/FathymEaCApplicationsPlugin.ts";
import { DefaultProcessorHandlerResolver } from "../processors/DefaultProcessorHandlerResolver.ts";
import { EaCAPIProcessorHandlerResolver } from "../processors/EaCAPIProcessorHandlerResolver.ts";
import { EaCAzureEventHubProcessorHandlerResolver } from "../processors/EaCAzureEventHubProcessorHandlerResolver.ts";
import { EaCDenoLSPProcessorHandlerResolver } from "../processors/EaCDenoLSPProcessorHandlerResolver.ts";
import { EaCDFSProcessorHandlerResolver } from "../processors/EaCDFSProcessorHandlerResolver.ts";
import { EaCMDXProcessorHandlerResolver } from "../processors/EaCMDXProcessorHandlerResolver.ts";
import { EaCOAuthProcessorHandlerResolver } from "../processors/EaCOAuthProcessorHandlerResolver.ts";
import { EaCNATSProcessorHandlerResolver } from "../processors/EaCNATSProcessorHandlerResolver.ts";
import { EaCPreactAppProcessorHandlerResolver } from "../processors/EaCPreactAppProcessorHandlerResolver.ts";
import { EaCProxyProcessorHandlerResolver } from "../processors/EaCProxyProcessorHandlerResolver.ts";
import { EaCRedirectProcessorHandlerResolver } from "../processors/EaCRedirectProcessorHandlerResolver.ts";
import { EaCResponseProcessorHandlerResolver } from "../processors/EaCResponseProcessorHandlerResolver.ts";
import { EaCStripeProcessorHandlerResolver } from "../processors/EaCStripeProcessorHandlerResolver.ts";
import { EaCTailwindProcessorHandlerResolver } from "../processors/EaCTailwindProcessorHandlerResolver.ts";
import { UnknownEaCProcessorHandlerResolver } from "../processors/UnknownEaCProcessorHandlerResolver.ts";
import { DefaultModifierMiddlewareResolver } from "../modifiers/DefaultModifierMiddlewareResolver.ts";
import { EaCBaseHREFModifierHandlerResolver } from "../modifiers/EaCBaseHREFModifierHandlerResolver.ts";
import { EaCDenoKVCacheModifierHandlerResolver } from "../modifiers/EaCDenoKVCacheModifierHandlerResolver.ts";
import { EaCGoogleTagMgrModifierHandlerResolver } from "../modifiers/EaCGoogleTagMgrModifierHandlerResolver.ts";
import { EaCJWTValidationModifierHandlerResolver } from "../modifiers/EaCJWTValidationModifierHandlerResolver.ts";
import { EaCKeepAliveModifierHandlerResolver } from "../modifiers/EaCKeepAliveModifierHandlerResolver.ts";
import { EaCMarkdownToHTMLModifierHandlerResolver } from "../modifiers/EaCMarkdownToHTMLModifierHandlerResolver.ts";
import { EaCMSAppInsightsModifierHandlerResolver } from "../modifiers/EaCMSAppInsightsModifierHandlerResolver.ts";
import { EaCOAuthModifierHandlerResolver } from "../modifiers/EaCOAuthModifierHandlerResolver.ts";
import { EaCStripeModifierHandlerResolver } from "../modifiers/EaCStripeModifierHandlerResolver.ts";
import { EaCTracingModifierHandlerResolver } from "../modifiers/EaCTracingModifierHandlerResolver.ts";

export class RuntimeBuilder {
  constructor(protected baseConfig: EaCRuntimeConfig) {}

  protected async buildIoC(eac: EverythingAsCode): Promise<IoCContainer> {
    const ioc = new IoCContainer();

    // Register LoggingProvider instance for resolvers that depend on it
    const logging = await this.baseConfig.LoggingProvider!;
    ioc.Register(LoggingProvider, () => logging);

    // Processor handler resolvers
    ioc.Register(DefaultProcessorHandlerResolver, {
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCAPIProcessorHandlerResolver, {
      Name: "EaCAPIProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCAzureEventHubProcessorHandlerResolver, {
      Name: "EaCAzureEventHubProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCDenoLSPProcessorHandlerResolver, {
      Name: "EaCDenoLSPProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCDFSProcessorHandlerResolver, {
      Name: "EaCDFSProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCMDXProcessorHandlerResolver, {
      Name: "EaCMDXProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCOAuthProcessorHandlerResolver, {
      Name: "EaCOAuthProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCNATSProcessorHandlerResolver, {
      Name: "EaCNATSProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCPreactAppProcessorHandlerResolver, {
      Name: "EaCPreactAppProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCProxyProcessorHandlerResolver, {
      Name: "EaCProxyProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCRedirectProcessorHandlerResolver, {
      Name: "EaCRedirectProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCResponseProcessorHandlerResolver, {
      Name: "EaCResponseProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCStripeProcessorHandlerResolver, {
      Name: "EaCStripeProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => EaCTailwindProcessorHandlerResolver, {
      Name: "EaCTailwindProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });
    ioc.Register(() => UnknownEaCProcessorHandlerResolver, {
      Name: "UnknownEaCProcessor",
      Type: ioc.Symbol("ProcessorHandlerResolver"),
    });

    // Modifier middleware resolvers
    ioc.Register(DefaultModifierMiddlewareResolver, {
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCBaseHREFModifierHandlerResolver, {
      Name: "EaCBaseHREFModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCDenoKVCacheModifierHandlerResolver, {
      Name: "EaCDenoKVCacheModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCGoogleTagMgrModifierHandlerResolver, {
      Name: "EaCGoogleTagMgrModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCJWTValidationModifierHandlerResolver, {
      Name: "EaCJWTValidationModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCKeepAliveModifierHandlerResolver, {
      Name: "EaCKeepAliveModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCMarkdownToHTMLModifierHandlerResolver, {
      Name: "EaCMarkdownToHTMLModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCMSAppInsightsModifierHandlerResolver, {
      Name: "EaCMSAppInsightsModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCOAuthModifierHandlerResolver, {
      Name: "EaCOAuthModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCStripeModifierHandlerResolver, {
      Name: "EaCStripeModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });
    ioc.Register(() => EaCTracingModifierHandlerResolver, {
      Name: "EaCTracingModifierDetails",
      Type: ioc.Symbol("ModifierHandlerResolver"),
    });

    // DFS file handler resolvers
    ioc.Register(DefaultDFSFileHandlerResolver, {
      Type: ioc.Symbol("DFSFileHandler"),
    });
    ioc.Register(
      () => EaCAzureBlobStorageDistributedFileSystemHandlerResolver,
      {
        Name: "EaCAzureBlobStorageDistributedFileSystem",
        Type: ioc.Symbol("DFSFileHandler"),
      },
    );
    ioc.Register(() => EaCDenoKVDistributedFileSystemHandlerResolver, {
      Name: "EaCDenoKVDistributedFileSystem",
      Type: ioc.Symbol("DFSFileHandler"),
    });
    ioc.Register(() => EaCESMDistributedFileSystemHandlerResolver, {
      Name: "EaCESMDistributedFileSystem",
      Type: ioc.Symbol("DFSFileHandler"),
    });
    ioc.Register(() => EaCJSRDistributedFileSystemHandlerResolver, {
      Name: "EaCJSRDistributedFileSystem",
      Type: ioc.Symbol("DFSFileHandler"),
    });
    ioc.Register(() => EaCLocalDistributedFileSystemHandlerResolver, {
      Name: "EaCLocalDistributedFileSystem",
      Type: ioc.Symbol("DFSFileHandler"),
    });
    ioc.Register(() => EaCNPMDistributedFileSystemHandlerResolver, {
      Name: "EaCNPMDistributedFileSystem",
      Type: ioc.Symbol("DFSFileHandler"),
    });
    ioc.Register(() => EaCRemoteDistributedFileSystemHandlerResolver, {
      Name: "EaCRemoteDistributedFileSystem",
      Type: ioc.Symbol("DFSFileHandler"),
    });
    ioc.Register(() => EaCWorkerDistributedFileSystemHandlerResolver, {
      Name: "EaCWorkerDistributedFileSystem",
      Type: ioc.Symbol("DFSFileHandler"),
    });
    ioc.Register(() => UnknownEaCDistributedFileSystemHandlerResolver, {
      Name: "UnknownEaCDistributedFileSystem",
      Type: ioc.Symbol("DFSFileHandler"),
    });

    // Configure Deno KV DBs from EaC (uses plugin Build)
    await new FathymEaCDenoKVPlugin().Build(eac, ioc);

    return ioc;
  }

  // Note: no-op; retaining for compatibility if future IoC merge is needed
  protected copyIoC(_from: IoCContainer, _to: IoCContainer) {}

  public async Build(
    eac: EverythingAsCode,
  ): Promise<{ routes: EaCRuntimeHandlerRouteGroup[]; revision?: string }> {
    const ioc = await this.buildIoC(eac);

    const apps = new FathymEaCApplicationsPlugin();

    await apps.Setup(this.baseConfig);

    const routes = await apps.AfterEaCResolved(eac, ioc);

    // Read revision from the base runtime configuration
    const revision = this.baseConfig.Runtime(this.baseConfig).Revision;

    return { routes, revision };
  }
}
