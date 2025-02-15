import {
  delay,
  EaCAPIProcessor,
  EaCApplicationAsCode,
  EaCCommitRequest,
  EaCDenoKVDetails,
  EaCDistributedFileSystemDetails,
  EaCJSRDistributedFileSystemDetails,
  EaCJWTValidationModifierDetails,
  EaCLocalDistributedFileSystemDetails,
  EaCProjectAsCode,
  EaCRuntimeConfig,
  EaCRuntimeHandlerRouteGroup,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EaCStatus,
  EaCStatusProcessingTypes,
  EaCSteward,
  EaCUserRecord,
  enqueueAtomic,
  EverythingAsCode,
  EverythingAsCodeApplications,
  EverythingAsCodeDenoKV,
  IoCContainer,
  loadJwtConfig,
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

export default class EaCStewardPlugin implements EaCRuntimePlugin {
  constructor(protected options?: EaCStewardPluginOptions) {}

  public async AfterEaCResolved(
    _eac: EverythingAsCode,
    ioc: IoCContainer,
    config: EaCRuntimeConfig,
  ): Promise<EaCRuntimeHandlerRouteGroup[]> {
    const steward = await ioc.Resolve(EaCSteward);

    // debugger;
    await steward.Start(ioc, "eac", "commit");

    await this.initializePrimaryEaC(config, ioc);

    return [];
  }

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
                FileRoot: "/src/steward/api/eac",
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac/dfs/workers/jsr",
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

    pluginConfig.IoC?.Register<EaCSteward>(EaCSteward, () => new EaCSteward());

    return pluginConfig;
  }

  protected async initializePrimaryEaC(
    config: EaCRuntimeConfig,
    ioc: IoCContainer,
  ): Promise<void> {
    const logger = (await config).LoggingProvider!.Package;

    logger.debug("Initializing primary EaC checks");

    const eacKv = await ioc.Resolve(Deno.Kv, "eac");

    const existingEaCs = await eacKv.list(
      { prefix: ["EaC", "Current"] },
      {
        limit: 1,
      },
    );

    let hasExistingEaCs = false;

    for await (const existingEaC of existingEaCs) {
      hasExistingEaCs = !!existingEaC.value;
      break;
    }

    if (!hasExistingEaCs) {
      logger.debug("Preparing core EaC record...");

      const commitKv = await ioc.Resolve<Deno.Kv>(Deno.Kv, "commit");

      const entLookup = crypto.randomUUID();

      const usernames = Deno.env.get("EAC_CORE_USERS")?.split("|") || [];

      const jwtConfig = loadJwtConfig();

      const createJwt = await jwtConfig.Create({ Username: usernames[0] });

      const createStatus: EaCStatus = {
        ID: crypto.randomUUID(),
        EnterpriseLookup: entLookup,
        Messages: { Queued: "Creating new EaC container" },
        Processing: EaCStatusProcessingTypes.QUEUED,
        StartTime: new Date(Date.now()),
        Username: usernames[0],
      };

      const commitReq: EaCCommitRequest = {
        CommitID: createStatus.ID,
        EaC: {
          EnterpriseLookup: createStatus.EnterpriseLookup,
          Details: {
            Name: "EaC Core",
            Description: "The core EaC that sits as parent to all other EaCs",
          },
        },
        JWT: createJwt,
        ProcessingSeconds: 60,
        Username: usernames[0],
      };

      await enqueueAtomic(
        commitKv,
        commitReq,
        (op) => {
          return op
            .set(
              [
                "EaC",
                "Status",
                createStatus.EnterpriseLookup,
                "ID",
                createStatus.ID,
              ],
              createStatus,
            )
            .set(
              ["EaC", "Status", createStatus.EnterpriseLookup, "EaC"],
              createStatus,
            );
        },
        eacKv,
      );

      logger.debug("Waiting for core EaC record...");

      let eac: EverythingAsCode | null;

      do {
        await delay(100);

        eac = (
          await eacKv.get<EverythingAsCode>([
            "EaC",
            "Current",
            createStatus.EnterpriseLookup,
          ])
        ).value;
      } while (!eac);

      logger.debug(
        `Core EaC record has been created: ${createStatus.EnterpriseLookup}`,
      );

      const mainJwt = await jwtConfig.Create(
        {
          EnterpriseLookup: createStatus.EnterpriseLookup,
          Username: usernames[0],
        },
        1000 * 60 * 60 * 24 * 365 * 5,
      );

      console.log(
        `The main JWT to use for connecting with EaC Core:\n
      ${mainJwt}`,
      );
      // logger.Package.debug(
      //   'The main JWT to use for connecting with EaC Core:',
      //   mainJwt,
      // );

      const userRecords = usernames.map((username) => {
        return {
          EnterpriseLookup: eac!.EnterpriseLookup,
          EnterpriseName: eac!.Details!.Name,
          ParentEnterpriseLookup: eac!.ParentEnterpriseLookup,
          Username: username,
        } as EaCUserRecord;
      });

      let usersSetupOp = eacKv.atomic();

      userRecords.forEach((userEaCRecord) => {
        usersSetupOp = usersSetupOp
          .set(
            ["User", userEaCRecord.Username, "EaC", entLookup],
            userEaCRecord,
          )
          .set(
            ["EaC", "Users", entLookup, userEaCRecord.Username],
            userEaCRecord,
          );
      });

      await usersSetupOp.commit();
    } else {
      logger.debug("There are existing EaC Records");
    }
  }
}
