import {
  DefaultDFSFileHandlerResolver,
  EaCDenoKVDistributedFileSystemHandlerResolver,
  EaCESMDistributedFileSystemHandlerResolver,
  EaCJSRDistributedFileSystemHandlerResolver,
  EaCLocalDistributedFileSystemHandlerResolver,
  EaCNPMDistributedFileSystemHandlerResolver,
  EaCRemoteDistributedFileSystemHandlerResolver,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EaCWorkerDistributedFileSystemHandlerResolver,
  IoCContainer,
  UnknownEaCDistributedFileSystemHandlerResolver,
} from "./.deps.ts";

export default class FathymDFSFileHandlerPlugin implements EaCRuntimePlugin {
  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: FathymDFSFileHandlerPlugin.name,
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(DefaultDFSFileHandlerResolver, {
      Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
    });

    pluginConfig.IoC!.Register(
      () => EaCDenoKVDistributedFileSystemHandlerResolver,
      {
        Name: "EaCDenoKVDistributedFileSystem",
        Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCESMDistributedFileSystemHandlerResolver,
      {
        Name: "EaCESMDistributedFileSystem",
        Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCJSRDistributedFileSystemHandlerResolver,
      {
        Name: "EaCJSRDistributedFileSystem",
        Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCLocalDistributedFileSystemHandlerResolver,
      {
        Name: "EaCLocalDistributedFileSystem",
        Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCNPMDistributedFileSystemHandlerResolver,
      {
        Name: "EaCNPMDistributedFileSystem",
        Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCRemoteDistributedFileSystemHandlerResolver,
      {
        Name: "EaCRemoteDistributedFileSystem",
        Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCWorkerDistributedFileSystemHandlerResolver,
      {
        Name: "EaCWorkerDistributedFileSystem",
        Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
      },
    );

    pluginConfig.IoC!.Register(
      () => UnknownEaCDistributedFileSystemHandlerResolver,
      {
        Name: "UnknownEaCDistributedFileSystem",
        Type: pluginConfig.IoC!.Symbol("DFSFileHandler"),
      },
    );

    return Promise.resolve(pluginConfig);
  }
}
