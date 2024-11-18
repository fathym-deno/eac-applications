import {
  EaCDenoKVDetails,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EaCSteward,
  EverythingAsCode,
  EverythingAsCodeApplications,
  EverythingAsCodeDenoKV,
} from "./.deps.ts";
import {
  EaCDistributedFileSystemDetails,
  EaCJSRDistributedFileSystemDetails,
  EaCLocalDistributedFileSystemDetails,
} from "jsr:@fathym/eac-dfs@0.0.15";
import {
  EaCApplicationAsCode,
  EaCProjectAsCode,
} from "../../applications/.exports.ts";
import { IoCContainer } from "jsr:@fathym/ioc@0.0.13";
import { EaCAPIProcessor } from "../../applications/processors/.exports.ts";

export type EaCStewardPluginOptions = {
  DFS?: {
    Details?: EaCDistributedFileSystemDetails;

    Lookup?: string;
  };

  Application?: {
    JWTValidationModifier?: {
      Lookup?: string;

      Priority?: number;
    };

    Lookup?: string;

    Path?: string;

    Priority?: number;
  };

  Project?: {
    Lookup?: string;
  };
};

export default class EaCStewardPlugin implements EaCRuntimePlugin {
  constructor(protected options?: EaCStewardPluginOptions) {}

  public async AfterEaCResolved(
    _eac: EverythingAsCode,
    ioc: IoCContainer,
  ): Promise<void> {
    const steward = await ioc.Resolve(EaCSteward);

    await steward.Start(ioc, "eac", "commit");
  }

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const stewardApiMetaPath = import.meta.resolve("../steward/api");

    const fileScheme = "file:///";

    const projLookup = this.options?.Project?.Lookup ?? "core";

    const appLookup = this.options?.Application?.Lookup ?? "steward";

    const dfsLookup = this.options?.DFS?.Lookup ?? "steward:api/eac";

    const jwtValidationLookup = this.options?.Application?.JWTValidationModifier
      ?.Lookup;

    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
    > = {
      Name: EaCStewardPlugin.name,
      IoC: new IoCContainer(),
      EaC: {
        Projects: {
          [projLookup]: {
            ApplicationResolvers: {
              [appLookup]: {
                PathPattern: this.options?.Application?.Path ?? "/api/steward*",
                Priority: this.options?.Application?.Priority ?? 500,
              },
            },
          } as EaCProjectAsCode,
        },
        Applications: {
          [appLookup]: {
            Details: {
              Name: "Steward API Endpoints",
              Description: "The Steward API endpoints to use.",
            },
            ModifierResolvers: {
              ...(jwtValidationLookup
                ? {
                  [jwtValidationLookup]: {
                    Priority: this.options!.Application!.JWTValidationModifier!
                      .Priority ?? 900,
                  },
                }
                : {}),
            },
            Processor: {
              Type: "API",
              DFSLookup: dfsLookup,
            } as EaCAPIProcessor,
          } as EaCApplicationAsCode,
        },
        DFSs: {
          dfsLookup: {
            Details: this.options?.DFS?.Details ??
                stewardApiMetaPath.startsWith(fileScheme)
              ? ({
                Type: "Local",
                FileRoot: stewardApiMetaPath.slice(fileScheme.length),
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac/runtime/workers/local",
                ),
              } as EaCLocalDistributedFileSystemDetails)
              : ({
                Type: "JSR",
                Package: "@fathym/eac-applications",
                Version: "",
                FileRoot: "/src/steward/api/",
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac/runtime/workers/jsr",
                ),
              } as EaCJSRDistributedFileSystemDetails),
          },
        },
        DenoKVs: {
          eac: {
            Details: {
              Type: "DenoKV",
              Name: "EaC DenoKV",
              Description:
                "The Deno KV database to use for storing EaC information",
              DenoKVPath: Deno.env.get("EAC_DENO_KV_PATH") || undefined,
            } as EaCDenoKVDetails,
          },
          commit: {
            Details: {
              Type: "DenoKV",
              Name: "EaC Commit DenoKV",
              Description:
                "The Deno KV database to use for the commit processing of an EaC",
              DenoKVPath: Deno.env.get("EAC_COMMIT_DENO_KV_PATH") || undefined,
            } as EaCDenoKVDetails,
          },
        },
      },
    };

    pluginConfig.IoC?.Register<EaCSteward>(() => new EaCSteward());

    return Promise.resolve(pluginConfig);
  }
}
