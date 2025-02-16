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
  IoCContainer,
  isEverythingAsCodeApplications,
  merge,
  ModifierHandlerResolver,
  processCacheControlHeaders,
  ProcessorHandlerResolver,
} from "./.deps.ts";

export default class FathymEaCApplicationsPlugin implements EaCRuntimePlugin {
  protected revision?: string;

  public async AfterEaCResolved(
    eac: EverythingAsCode,
    ioc: IoCContainer,
  ): Promise<EaCRuntimeHandlerRouteGroup[]> {
    return await this.configureRuntimeRouteMatrix(eac, ioc);
  }

  public Setup(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: FathymEaCApplicationsPlugin.name,
    };

    this.revision = config.Runtime(config).Revision;

    return Promise.resolve(pluginConfig);
  }

  protected async buildApplicationGraph(
    eac: EverythingAsCode,
    ioc: IoCContainer,
    projGraph: EaCProjectProcessorConfig[],
  ): Promise<Record<string, EaCApplicationProcessorConfig[]>> {
    const appGraph = {} as Record<string, EaCApplicationProcessorConfig[]>;

    if (isEverythingAsCodeApplications(eac) && eac!.Applications) {
      const projProcCfgCalls = projGraph!.map(async (projProcCfg) => {
        const appLookups = Object.keys(
          projProcCfg.Project.ApplicationResolvers || {},
        );

        appGraph![projProcCfg.ProjectLookup] = appLookups
          .map((appLookup) => {
            if (!isEverythingAsCodeApplications(eac)) {
              // This will never happen, check is just to get proper typing
              throw new Error();
            }

            const app = eac!.Applications![appLookup];

            if (!app) {
              throw new Error(
                `The '${appLookup}' app configured for the project does not exist in the EaC Applications configuration.`,
              );
            }

            const resolverCfg =
              projProcCfg.Project.ApplicationResolvers[appLookup];

            return {
              Application: app,
              ApplicationLookup: appLookup,
              ResolverConfig: resolverCfg,
              // Pattern: new URLPattern({ pathname: resolverCfg.PathPattern }),
              Revision: this.revision,
            } as EaCApplicationProcessorConfig;
          })
          .sort((a, b) => {
            return b.ResolverConfig.Priority - a.ResolverConfig.Priority;
          });

        const appProcCfgCalls = appGraph![projProcCfg.ProjectLookup].map(
          async (appProcCfg) => {
            if (!isEverythingAsCodeApplications(eac)) {
              // This will never happen, check is just to get proper typing
              throw new Error();
            }

            const pipeline = await this.constructPipeline(
              ioc,
              projProcCfg.Project,
              appProcCfg.Application,
              eac!.Modifiers || {},
            );

            pipeline.Append(
              await this.establishApplicationHandler(eac, ioc, appProcCfg),
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
  ): EaCProjectProcessorConfig[] {
    const projGraph: EaCProjectProcessorConfig[] = [];

    if (isEverythingAsCodeApplications(eac) && eac!.Projects) {
      const projLookups = Object.keys(eac?.Projects || {});

      const procCfgs: EaCProjectProcessorConfig[] = projLookups
        .map((projLookup) => {
          if (!isEverythingAsCodeApplications(eac)) {
            // This will never happen, check is just to get proper typing
            throw new Error();
          }

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
  ): Promise<EaCRuntimeHandlerRouteGroup[]> {
    let projGraph = this.buildProjectGraph(eac);

    const appGraph = await this.buildApplicationGraph(eac, ioc, projGraph);

    projGraph = projGraph.map((projProcCfg) => {
      return {
        ...projProcCfg,
        // Handler: this.establishProjectHandler(projProcCfg, appGraph),
      };
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
          ctx,
        ) => {
          const appResolverConfig = appProcCfg.ResolverConfig;

          const isAllowedMethod = !appResolverConfig.AllowedMethods ||
            appResolverConfig.AllowedMethods.length === 0 ||
            appResolverConfig.AllowedMethods.some(
              (arc) => arc.toLowerCase() === req.method.toLowerCase(),
            );

          const matchesRegex = !appResolverConfig.UserAgentRegex ||
            new RegExp(appResolverConfig.UserAgentRegex).test(
              req.headers.get("user-agent") || "",
            );

          // TODO(mcgear): How to account for IsPrivate/IsTriggerSignIn during application resolution...
          //    Maybe return a list of available apps, so their handlers can be nexted through
          //    Think through logic, as this already may be happening based on configs?...

          const pattern = new URLPattern({
            pathname: appResolverConfig.PathPattern,
          });

          const activate = pattern.test(req.url) && isAllowedMethod &&
            matchesRegex;

          if (activate) {
            ctx.Runtime = merge(
              ctx.Runtime,
              {
                ApplicationProcessorConfig: appProcCfg,
                URLMatch: buildURLMatch(pattern, req),
              } as EaCApplicationsRuntimeContext["Runtime"],
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
    project: EaCProjectAsCode,
    application: EaCApplicationAsCode,
    modifiers: Record<string, EaCModifierAsCode | null>,
  ): Promise<EaCRuntimeHandlerPipeline> {
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

    const pipeline = new EaCRuntimeHandlerPipeline();

    const defaultModifierMiddlewareResolver = await ioc.Resolve<
      ModifierHandlerResolver
    >(
      ioc.Symbol("ModifierHandlerResolver"),
    );

    for (const mod of pipelineModifiers) {
      pipeline.Append(
        await defaultModifierMiddlewareResolver.Resolve(ioc, mod),
      );
    }

    return pipeline;
  }

  protected async establishApplicationHandler(
    eac: EverythingAsCode,
    ioc: IoCContainer,
    appProcessorConfig: EaCApplicationProcessorConfig,
  ): Promise<EaCRuntimeHandler> {
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
