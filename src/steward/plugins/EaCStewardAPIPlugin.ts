import {
  EaCAPIProcessor,
  EaCApplicationAsCode,
  EaCDenoKVDetails,
  EaCDistributedFileSystemDetails,
  EaCJSRDistributedFileSystemDetails,
  EaCJWTValidationModifierDetails,
  EaCLocalDistributedFileSystemDetails,
  EaCProjectAsCode,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EverythingAsCode,
  EverythingAsCodeApplications,
  EverythingAsCodeDenoKV,
  IoCContainer,
} from "./.deps.ts";

export type EaCStewardAPIPluginOptions = {
  Application?: {
    JWTValidationModifier?: {
      Lookup?: string;

      Priority?: number;
    };

    Lookup?: string;

    Path?: string;

    Priority?: number;
  };

  DenoKVs?: {
    StewardCommitDBLookup?: string;

    StewardDBLookup?: string;
  };

  DFS?: {
    Details?: EaCDistributedFileSystemDetails;

    Lookup?: string;
  };

  Project?: {
    Lookup?: string;
  };
};

export default class EaCStewardAPIPlugin implements EaCRuntimePlugin {
  protected get stewardCommitDBLookup(): string {
    return this.options?.DenoKVs?.StewardDBLookup || "commit";
  }

  protected get stewardDBLookup(): string {
    return this.options?.DenoKVs?.StewardDBLookup || "eac";
  }

  constructor(protected options?: EaCStewardAPIPluginOptions) {}

  public async Setup(
    config: EaCRuntimeConfig,
  ): Promise<EaCRuntimePluginConfig> {
    const stewardApiMetaPath = import.meta.resolve("../api/eac/");

    const fileScheme = "file:///";

    const projLookup = this.options?.Project?.Lookup || "core";

    const appLookup = this.options?.Application?.Lookup || "eac-steward";

    const dfsLookup = this.options?.DFS?.Lookup || "steward:api/eac";

    const jwtValidationLookup =
      this.options?.Application?.JWTValidationModifier?.Lookup || "jwtValidate";

    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
    > = {
      Name: EaCStewardAPIPlugin.name,
      IoC: new IoCContainer(),
      EaC: {
        Projects: {
          [projLookup]: {
            ApplicationResolvers: {
              [appLookup]: {
                PathPattern: this.options?.Application?.Path ?? "/api/steward*",
                Priority: this.options?.Application?.Priority ?? 400,
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
              [jwtValidationLookup]: {
                Priority:
                  this.options?.Application?.JWTValidationModifier?.Priority ??
                    900,
              },
            },
            Processor: {
              Type: "API",
              DFSLookup: dfsLookup,
            } as EaCAPIProcessor,
          } as EaCApplicationAsCode,
        },
        DFSs: {
          [dfsLookup]: {
            Details: this.options?.DFS?.Details ??
                stewardApiMetaPath.startsWith(fileScheme)
              ? ({
                Type: "Local",
                FileRoot: stewardApiMetaPath.slice(fileScheme.length),
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac/dfs/workers/local",
                ),
              } as EaCLocalDistributedFileSystemDetails)
              : ({
                Type: "JSR",
                Package: "@fathym/eac-applications",
                Version: "",
                FileRoot: "/src/steward/api/eac/",
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac/dfs/workers/jsr",
                ),
              } as EaCJSRDistributedFileSystemDetails),
          },
        },
        DenoKVs: {
          [this.stewardCommitDBLookup]: {
            Details: {
              Type: "DenoKV",
              Name: "EaC Steward Commit DenoKV",
              Description:
                "The Deno KV database to use for the commit processing of an EaC",
              DenoKVPath: Deno.env.get("STEWARD_COMMIT_DENO_KV_PATH") ||
                undefined,
            } as EaCDenoKVDetails,
          },
          [this.stewardDBLookup]: {
            Details: {
              Type: "DenoKV",
              Name: "EaC Steward DenoKV",
              Description:
                "The Deno KV database to use for storing EaC information",
              DenoKVPath: Deno.env.get("STEWARD_DENO_KV_PATH") || undefined,
            } as EaCDenoKVDetails,
          },
        },
        Modifiers: {
          ...(jwtValidationLookup
            ? {
              [jwtValidationLookup]: {
                Details: {
                  Type: "JWTValidation",
                  Name: "Validate JWT",
                  Description: "Validate incoming JWTs to restrict access.",
                } as EaCJWTValidationModifierDetails,
              },
            }
            : {}),
        },
      },
    };

    return pluginConfig;
  }
}
