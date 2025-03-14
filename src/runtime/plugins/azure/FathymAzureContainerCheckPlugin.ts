import {
  EaCResponseProcessor,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EverythingAsCode,
  EverythingAsCodeApplications,
  IoCContainer,
} from "../.deps.ts";

/**
 * Used to configure a handler for the azure container start processes.
 */
export default class FathymAzureContainerCheckPlugin
  implements EaCRuntimePlugin {
  public Setup(
    config: EaCRuntimeConfig<EverythingAsCode & EverythingAsCodeApplications>,
  ): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications
    > = {
      Name: FathymAzureContainerCheckPlugin.name,
      IoC: new IoCContainer(),
      Plugins: [],
      EaC: {
        Projects: {
          azureContainerCheck: {
            Details: {
              Name: "Everything as Code Azure Container Check",
              Description:
                "A check used by azure to determine if the container is running.",
              Priority: 200,
            },
            ResolverConfigs: {
              azureHook: {
                Hostname: "*",
                Path: "/robots933456.txt",
                Port: config.Servers![0].port,
              },
            },
            ApplicationResolvers: {
              azureContainerCheck: {
                PathPattern: "*",
                Priority: 100,
              },
            },
          },
        },
        Applications: {
          azureContainerCheck: {
            Details: {
              Name: "Azure Container Check",
              Description: "A response for the azure container check.",
            },
            ModifierResolvers: {},
            Processor: {
              Type: "Response",
              Body: "",
              Status: 200,
            } as EaCResponseProcessor,
          },
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
