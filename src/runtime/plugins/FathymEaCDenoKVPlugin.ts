import {
  EaCDenoKVDetails,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EverythingAsCode,
  initializeDenoKv,
  IoCContainer,
  isEaCDenoKVDetails,
  isEverythingAsCodeDenoKV,
} from "./.deps.ts";

export default class FathymEaCDenoKVPlugin implements EaCRuntimePlugin {
  public AfterEaCResolved(
    eac: EverythingAsCode,
    ioc: IoCContainer,
  ): Promise<void> {
    return Promise.resolve(this.configureEaCDenoKV(eac, ioc));
  }

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: FathymEaCDenoKVPlugin.name,
    };

    return Promise.resolve(pluginConfig);
  }

  protected configureEaCDenoKV(eac: EverythingAsCode, ioc: IoCContainer): void {
    if (isEverythingAsCodeDenoKV(eac)) {
      const dbLookups = Object.keys(eac!.DenoKVs || {});

      dbLookups.forEach((dbLookup) => {
        const db = eac!.DenoKVs![dbLookup];

        if (isEaCDenoKVDetails(db.Details)) {
          const dbDetails = db.Details as EaCDenoKVDetails;

          ioc.Register(Deno.Kv, () => initializeDenoKv(dbDetails.DenoKVPath), {
            Lazy: true,
            Name: dbLookup,
          });
        }
      });
    }
  }
}
