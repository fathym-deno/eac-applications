import {
  delay,
  EaCCommitRequest,
  EaCDenoKVDetails,
  EaCDistributedFileSystemDetails,
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
  DenoKVs?: {
    StewardCommitDBLookup?: string;

    StewardDBLookup?: string;
  };
};

export default class EaCStewardPlugin implements EaCRuntimePlugin {
  protected get stewardCommitDBLookup(): string {
    return this.options?.DenoKVs?.StewardDBLookup || "commit";
  }

  protected get stewardDBLookup(): string {
    return this.options?.DenoKVs?.StewardDBLookup || "eac";
  }

  constructor(protected options?: EaCStewardPluginOptions) {}

  public async AfterEaCResolved(
    _eac: EverythingAsCode,
    ioc: IoCContainer,
    config: EaCRuntimeConfig,
  ): Promise<EaCRuntimeHandlerRouteGroup[]> {
    const steward = await ioc.Resolve(EaCSteward);

    await steward.Start(ioc, this.stewardDBLookup, this.stewardCommitDBLookup);

    await this.initializePrimaryEaC(config, ioc);

    return [];
  }

  public async Setup(
    config: EaCRuntimeConfig,
  ): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
    > = {
      Name: EaCStewardPlugin.name,
      IoC: new IoCContainer(),
      EaC: {
        DenoKVs: {
          [this.options?.DenoKVs?.StewardDBLookup || "eac"]: {
            Details: {
              Type: "DenoKV",
              Name: "EaC Steward DenoKV",
              Description:
                "The Deno KV database to use for storing EaC information",
              DenoKVPath: Deno.env.get("STEWARD_DENO_KV_PATH") || undefined,
            } as EaCDenoKVDetails,
          },
          [this.options?.DenoKVs?.StewardCommitDBLookup || "commit"]: {
            Details: {
              Type: "DenoKV",
              Name: "EaC Steward Commit DenoKV",
              Description:
                "The Deno KV database to use for the commit processing of an EaC",
              DenoKVPath: Deno.env.get("STEWARD_COMMIT_DENO_KV_PATH") ||
                undefined,
            } as EaCDenoKVDetails,
          },
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
    debugger;
    const logger = (await config).LoggingProvider!.Package;

    logger.debug("Initializing primary EaC checks");

    const eacKv = await ioc.Resolve(Deno.Kv, this.stewardDBLookup);

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

      const commitKv = await ioc.Resolve<Deno.Kv>(
        Deno.Kv,
        this.stewardCommitDBLookup,
      );

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
    }
  }
}
