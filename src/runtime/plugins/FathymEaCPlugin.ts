import { loadEaCStewardSvc } from "jsr:@fathym/eac@0.2.17/steward/clients";
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
  constructor() {}

  public async Setup(
    config: EaCRuntimeConfig,
  ): Promise<EaCRuntimePluginConfig> {
    const logger = config.LoggingProvider!.Package;

    const pluginConfig: EaCRuntimePluginConfig = {
      Name: FathymEaCPlugin.name,
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

        const eacSvc = await loadEaCStewardSvc(eacApiKey);

        pluginConfig.EaC = await eacSvc.EaC.Get(EnterpriseLookup as string);

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
