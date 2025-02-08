import {
  ConsoleHandler,
  EaCLoggingProvider,
  LevelName,
  LogConfig,
  LoggerConfig,
} from "./.deps.ts";

export class EaCApplicationsLoggingProvider extends EaCLoggingProvider {
  constructor(loggingPackages?: string[], override?: boolean) {
    const defaults = [
      "@fathym/eac",
      "@fathym/eac-applications",
      "@fathym/eac-azure",
      "@fathym/eac-deno-kv",
      "@fathym/eac-github",
      "@fathym/eac-identity",
      "@fathym/eac-sources",
    ];

    loggingPackages ??= [];

    if (!override) {
      loggingPackages = [...defaults, ...loggingPackages];
    }

    super(loggingPackages, override);
  }
}
