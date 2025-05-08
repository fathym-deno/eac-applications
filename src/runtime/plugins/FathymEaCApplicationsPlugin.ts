import { LoggingProvider } from "jsr:@fathym/common@0.2.184/log";
import {
  buildURLMatch,
  EAC_RUNTIME_DEV,
  EaCApplicationAsCode,
  EaCApplicationProcessorConfig,
  EaCApplicationsRuntimeContext,
  EaCModifierAsCode,
  EaCModifierResolverConfiguration,
  EaCProjectAsCode,
  EaCProjectProcessorConfig,
  EaCRuntimeConfig,
  EaCRuntimeHandler,
  EaCRuntimeHandlerPipeline,
  EaCRuntimeHandlerRoute,
  EaCRuntimeHandlerRouteGroup,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EverythingAsCode,
  EverythingAsCodeApplications,
  IoCContainer,
  isEverythingAsCodeApplications,
  merge,
  ModifierHandlerResolver,
  processCacheControlHeaders,
  ProcessorHandlerResolver,
} from "./.deps.ts";
import { Logger } from "../modules/.deps.ts";

export default class FathymEaCApplicationsPlugin implements EaCRuntimePlugin {
  protected revision?: string;

  public async AfterEaCResolved(
    eac: EverythingAsCode,
    ioc: IoCContainer,
  ): Promise<EaCRuntimeHandlerRouteGroup[]> {
    const logger = await ioc.Resolve(LoggingProvider);

    logger.Package.debug("Resolving routes after EaC processed...");

    return await this.configureRuntimeRouteMatrix(eac, ioc, logger.Package);
  }

  public async Setup(
    config: EaCRuntimeConfig,
  ): Promise<EaCRuntimePluginConfig> {
    const logger = await config.LoggingProvider;

    logger.Package.debug("Running Setup for FathymEaCApplicationsPlugin...");

    const pluginConfig: EaCRuntimePluginConfig = {
      Name: FathymEaCApplicationsPlugin.name,
    };

    this.revision = config.Runtime(config).Revision;

    return pluginConfig;
  }

  protected async buildApplicationGraph(
    eac: EverythingAsCode,
    ioc: IoCContainer,
    logger: Logger,
    projGraph: EaCProjectProcessorConfig[],
  ): Promise<Record<string, EaCApplicationProcessorConfig[]>> {
    logger.debug("Building application graph...");
    const appGraph = {} as Record<string, EaCApplicationProcessorConfig[]>;

    if (isEverythingAsCodeApplications(eac) && eac!.Applications) {
      const projProcCfgCalls = projGraph!.map(async (projProcCfg) => {
        logger.debug(`Processing project: ${projProcCfg.ProjectLookup}`);

        const appLookups = Object.keys(
          projProcCfg.Project.ApplicationResolvers || {},
        );

        appGraph![projProcCfg.ProjectLookup] = appLookups
          .map((appLookup) => {
            const app = eac!.Applications![appLookup];

            if (!app) {
              logger.error(
                `Missing application config for lookup: ${appLookup}`,
              );
              throw new Error(
                `The '${appLookup}' app configured for the project does not exist in the EaC Applications configuration.`,
              );
            }

            return {
              Application: app,
              ApplicationLookup: appLookup,
              ResolverConfig:
                projProcCfg.Project.ApplicationResolvers[appLookup],
              Revision: this.revision,
            } as EaCApplicationProcessorConfig;
          })
          .sort((a, b) => {
            return b.ResolverConfig.Priority - a.ResolverConfig.Priority;
          });

        const appProcCfgCalls = appGraph![projProcCfg.ProjectLookup].map(
          async (appProcCfg) => {
            const pipeline = await this.constructPipeline(
              ioc,
              logger,
              projProcCfg,
              appProcCfg,
              eac,
            );

            logger.debug(
              `Assigned pipeline to app: ${appProcCfg.ApplicationLookup}`,
            );

            appProcCfg.Handler = pipeline;
          },
        );

        await Promise.all(appProcCfgCalls);
      });

      await Promise.all(projProcCfgCalls);
    }

    return appGraph;
  }

  protected buildProjectGraph(
    eac: EverythingAsCode,
    logger: Logger,
  ): EaCProjectProcessorConfig[] {
    logger.debug("Building project graph...");

    const projGraph: EaCProjectProcessorConfig[] = [];

    if (isEverythingAsCodeApplications(eac) && eac!.Projects) {
      const projLookups = Object.keys(eac?.Projects || {});

      const procCfgs: EaCProjectProcessorConfig[] = projLookups
        .map((projLookup) => {
          const proj = eac!.Projects![projLookup]!;

          const resolverKeys = Object.keys(proj.ResolverConfigs);

          return {
            Project: proj,
            ProjectLookup: projLookup,
            Patterns: resolverKeys.map((lk) => {
              const resolverCfg = proj.ResolverConfigs[lk];

              return new URLPattern({
                hostname: resolverCfg.Hostname,
                port: resolverCfg.Port?.toString(),
                pathname: resolverCfg.Path,
              });
            }),
          } as EaCProjectProcessorConfig;
        })
        .sort((a, b) => {
          return b.Project.Details!.Priority - a.Project.Details!.Priority;
        });

      projGraph.push(...procCfgs);
    }

    return projGraph;
  }

  protected async configureRuntimeRouteMatrix(
    eac: EverythingAsCode,
    ioc: IoCContainer,
    logger: Logger,
  ): Promise<EaCRuntimeHandlerRouteGroup[]> {
    logger.debug("Configuring route matrix...");

    let projGraph = this.buildProjectGraph(eac, logger);

    const appGraph = await this.buildApplicationGraph(
      eac,
      ioc,
      logger,
      projGraph,
    );

    projGraph = projGraph.map((projProcCfg) => {
      return { ...projProcCfg };
    });

    return projGraph.map((projProcCfg) => {
      const projActivator: EaCRuntimeHandlerRouteGroup["Activator"] = (
        req,
        ctx,
      ) => {
        const activate = projProcCfg.Patterns.some((pattern) =>
          pattern.test(req.url)
        );

        if (activate) {
          logger.debug(`Activated project route: ${projProcCfg.ProjectLookup}`);
          ctx.Runtime = merge(
            ctx.Runtime,
            {
              ProjectProcessorConfig: projProcCfg,
            } as EaCApplicationsRuntimeContext["Runtime"],
          );
        }

        return activate;
      };

      const projAppProcCfgs = appGraph[projProcCfg.ProjectLookup];

      const routes = projAppProcCfgs.map((appProcCfg) => {
        const appActivator: EaCRuntimeHandlerRoute["Activator"] = (
          req,
          _ctx,
        ) => {
          const appResolverConfig = appProcCfg.ResolverConfig;

          const pattern = new URLPattern({
            pathname: appResolverConfig.PathPattern,
          });

          const isAllowedMethod = !appResolverConfig.AllowedMethods ||
            appResolverConfig.AllowedMethods.length === 0 ||
            appResolverConfig.AllowedMethods.some(
              (arc) => arc.toLowerCase() === req.method.toLowerCase(),
            );

          const userAgent = req.headers.get("user-agent") || "";
          const matchesRegex = !appResolverConfig.UserAgentRegex ||
            new RegExp(appResolverConfig.UserAgentRegex).test(userAgent);

          const pathMatched = pattern.test(req.url);

          const activate = pathMatched && isAllowedMethod && matchesRegex;

          logger.debug(
            `[App Route: ${appProcCfg.ApplicationLookup}] Trying to match: ${req.method} ${req.url}
            → PathPattern: "${appResolverConfig.PathPattern}" ${
              pathMatched ? "✓" : "✗"
            }
            → AllowedMethods: ${
              JSON.stringify(
                appResolverConfig.AllowedMethods,
              )
            } ${isAllowedMethod ? "✓" : "✗"}
            → UserAgentRegex: ${appResolverConfig.UserAgentRegex || "n/a"} ${
              matchesRegex ? "✓" : "✗"
            }
            → Final activation: ${activate ? "✅ MATCHED" : "❌ not matched"}`,
          );

          if (activate) {
            logger.debug(
              `Activated application route: ${appProcCfg.ApplicationLookup}`,
            );
          }

          return activate;
        };

        return {
          Name: appProcCfg.ApplicationLookup,
          Activator: appActivator,
          Handler: appProcCfg.Handler,
          ResolverConfig: appProcCfg.ResolverConfig,
        } as EaCRuntimeHandlerRoute;
      });

      return {
        Name: projProcCfg.ProjectLookup,
        Activator: projActivator,
        Routes: routes,
      } as EaCRuntimeHandlerRouteGroup;
    });
  }

  protected async constructPipeline(
    ioc: IoCContainer,
    logger: Logger,
    projProcCfg: EaCProjectProcessorConfig,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: EverythingAsCodeApplications,
  ): Promise<EaCRuntimeHandlerPipeline> {
    logger.debug(
      `Constructing pipeline for app: ${appProcCfg.ApplicationLookup}`,
    );
    const pipeline = new EaCRuntimeHandlerPipeline();

    pipeline.Append((req, ctx) => {
      ctx.Runtime = merge(
        ctx.Runtime,
        {
          ApplicationProcessorConfig: appProcCfg,
        } as EaCApplicationsRuntimeContext["Runtime"],
      );

      return ctx.Next();
    });

    const pipelineModifiers = this.establishPipelineModifiers(
      projProcCfg.Project,
      appProcCfg.Application,
      eac.Modifiers || {},
    );

    const defaultModifierMiddlewareResolver = await ioc.Resolve<
      ModifierHandlerResolver
    >(
      ioc.Symbol("ModifierHandlerResolver"),
    );

    for (const mod of pipelineModifiers) {
      logger.debug(`Appending modifier middleware: ${mod.Details?.Name}`);
      pipeline.Append(
        await defaultModifierMiddlewareResolver.Resolve(ioc, mod),
      );
    }

    pipeline.Append(
      await this.establishApplicationHandler(eac, ioc, logger, appProcCfg),
    );

    return pipeline;
  }

  protected establishPipelineModifiers(
    project: EaCProjectAsCode,
    application: EaCApplicationAsCode,
    modifiers: Record<string, EaCModifierAsCode>,
  ): EaCModifierAsCode[] {
    let pipelineModifierResolvers: Record<
      string,
      EaCModifierResolverConfiguration
    > = {};

    // TODO(mcgear): Add application logic middlewares to pipeline... Maybe not, might be in activators now...

    pipelineModifierResolvers = merge(
      pipelineModifierResolvers,
      project.ModifierResolvers || {},
    );

    pipelineModifierResolvers = merge(
      pipelineModifierResolvers,
      application.ModifierResolvers || {},
    );

    const pipelineModifiers: EaCModifierAsCode[] = [];

    const modifierLookups = Object.keys(pipelineModifierResolvers);

    modifierLookups
      .map((ml) => ({
        Lookup: ml,
        Config: pipelineModifierResolvers[ml],
      }))
      .sort((a, b) => b.Config.Priority - a.Config.Priority)
      .forEach((ml) => {
        if (ml.Lookup in modifiers) {
          pipelineModifiers.push(modifiers[ml.Lookup]!);
        }
      });

    return pipelineModifiers;
  }

  protected async establishApplicationHandler(
    eac: EverythingAsCode,
    ioc: IoCContainer,
    logger: Logger,
    appProcessorConfig: EaCApplicationProcessorConfig,
  ): Promise<EaCRuntimeHandler> {
    logger.debug(
      `Resolving handler for app: ${appProcessorConfig.ApplicationLookup}`,
    );

    const defaultProcessorHandlerResolver = await ioc.Resolve<
      ProcessorHandlerResolver
    >(
      ioc.Symbol("ProcessorHandlerResolver"),
    );

    let handler = await defaultProcessorHandlerResolver.Resolve(
      ioc,
      appProcessorConfig,
      eac!,
    );

    if (
      handler &&
      appProcessorConfig.Application.Processor.CacheControl &&
      !EAC_RUNTIME_DEV()
    ) {
      logger.debug("Wrapping handler with cache-control logic.");

      const cacheHandler = handler;

      handler = async (req, ctx) => {
        let resp = await cacheHandler(req, ctx);

        if (resp.ok) {
          resp = processCacheControlHeaders(
            resp,
            appProcessorConfig.Application.Processor.CacheControl,
            appProcessorConfig.Application.Processor.ForceCache,
          );
        }

        return resp;
      };
    }

    return handler!;
  }
}
