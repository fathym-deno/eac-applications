import {
  colors,
  djwt,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EverythingAsCode,
  loadJwtConfig,
} from "./.deps.ts";

export default class FathymEaCPlugin implements EaCRuntimePlugin {
  constructor(
    protected loadEaC: (eacApiKey: string) => Promise<EverythingAsCode>,
  ) {}

  public async Setup(
    config: EaCRuntimeConfig,
  ): Promise<EaCRuntimePluginConfig> {
    const logger = config.LoggingProvider!.Package;

    const pluginConfig: EaCRuntimePluginConfig = {
      Name: "FathymEaCPlugin",
    };

    let eacApiKey = Deno.env.get("EAC_API_KEY");

    if (!eacApiKey) {
      const eacApiEntLookup = Deno.env.get("EAC_API_ENTERPRISE_LOOKUP");

      if (eacApiEntLookup) {
        const eacApiUsername = Deno.env.get("EAC_API_USERNAME");

        eacApiKey = await loadJwtConfig().Create(
          {
            EnterpriseLookup: eacApiEntLookup,
            Username: eacApiUsername,
          },
          60 * 60 * 1,
        );
      }
    }

    if (eacApiKey) {
      try {
        const [_header, payload] = await djwt.decode(eacApiKey);

        const { EnterpriseLookup } = payload as Record<string, string>;

        // const eacSvc = await loadEaCSvc(eacApiKey);

        // const eac = await eacSvc.Get(EnterpriseLookup as string);

        const eac = await this.loadEaC(eacApiKey);

        pluginConfig.EaC = eac;

        if (pluginConfig.EaC && !pluginConfig.EaC.EnterpriseLookup) {
          pluginConfig.EaC.EnterpriseLookup = EnterpriseLookup;
        }

        logger.debug(
          `Loaded and merged EaC configuration for: '${
            colors.blue(
              EnterpriseLookup,
            )
          }'`,
        );
      } catch (_err) {
        logger.error(
          "Unable to connect to the EaC service, falling back to local config.",
        );
      }
    }

    return pluginConfig;
  }
}
