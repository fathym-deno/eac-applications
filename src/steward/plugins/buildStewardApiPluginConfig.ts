import {
  EaCAPIProcessor,
  EaCApplicationAsCode,
  EaCDistributedFileSystemDetails,
  EaCJSRDistributedFileSystemDetails,
  EaCLocalDistributedFileSystemDetails,
  EaCProjectAsCode,
  EaCRuntimePluginConfig,
  EverythingAsCode,
  EverythingAsCodeApplications,
  EverythingAsCodeDenoKV,
  IoCContainer,
} from "./.deps.ts";

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

export function buildStewardApiPluginConfig(
  pluginName: string,
  stewardApiMetaPath: string,
  defaultProjLookup: string,
  defaultAppLookup: string,
  defaultDFSLookup: string,
  defaultAppPath: string,
  packageName: string,
  options?: EaCStewardPluginOptions,
): EaCRuntimePluginConfig<
  EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
> {
  const fileScheme = "file:///";

  const projLookup = options?.Project?.Lookup ?? defaultProjLookup;

  const appLookup = options?.Application?.Lookup ?? defaultAppLookup;

  const dfsLookup = options?.DFS?.Lookup ?? defaultDFSLookup;

  const jwtValidationLookup = options?.Application?.JWTValidationModifier
    ?.Lookup;

  return {
    Name: pluginName,
    IoC: new IoCContainer(),
    EaC: {
      Projects: {
        [projLookup]: {
          ApplicationResolvers: {
            [appLookup]: {
              PathPattern: options?.Application?.Path ?? defaultAppPath,
              Priority: options?.Application?.Priority ?? 700,
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
                  Priority:
                    options!.Application!.JWTValidationModifier!.Priority ??
                      900,
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
        [dfsLookup]: {
          Details:
            options?.DFS?.Details ?? stewardApiMetaPath.startsWith(fileScheme)
              ? ({
                Type: "Local",
                FileRoot: stewardApiMetaPath.slice(fileScheme.length),
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac-dfs/workers/local",
                ),
              } as EaCLocalDistributedFileSystemDetails)
              : ({
                Type: "JSR",
                Package: packageName,
                Version: "",
                FileRoot: "/src/steward/api/",
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac-dfs/workers/jsr",
                ),
              } as EaCJSRDistributedFileSystemDetails),
        },
      },
    },
  };
}
