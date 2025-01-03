import {
  buildURLMatch,
  EAC_RUNTIME_DEV,
  EaCApplicationAsCode,
  EaCApplicationProcessorConfig,
  EaCModifierAsCode,
  EaCModifierResolverConfiguration,
  EaCProjectAsCode,
  EaCProjectProcessorConfig,
  EaCRuntimeConfig,
  EaCRuntimeHandler,
  EaCRuntimeHandlerPipeline,
  EaCRuntimeHandlerRouteGroup,
  EaCRuntimeHandlerSet,
  ESBuild,
  EverythingAsCode,
  EverythingAsCodeApplications,
  GenericEaCRuntime,
  IS_DENO_DEPLOY,
  isEverythingAsCodeApplications,
  merge,
  ModifierHandlerResolver,
  processCacheControlHeaders,
  ProcessorHandlerResolver,
} from "./.deps.ts";
import { EaCApplicationsRuntimeContext } from "./EaCApplicationsRuntimeContext.ts";

export class EaCApplicationsRuntime<
  TEaC extends
    & EverythingAsCode
    & EverythingAsCodeApplications =
      & EverythingAsCode
      & EverythingAsCodeApplications,
> extends GenericEaCRuntime<TEaC> {
  constructor(config: EaCRuntimeConfig<TEaC>) {
    super(config);
  }

  protected async buildApplicationGraph(
    projGraph: EaCProjectProcessorConfig[],
  ): Promise<Record<string, EaCApplicationProcessorConfig[]>> {
    const appGraph = {} as Record<string, EaCApplicationProcessorConfig[]>;

    if (isEverythingAsCodeApplications(this.EaC) && this.EaC!.Applications) {
      const projProcCfgCalls = projGraph!.map(async (projProcCfg) => {
        const appLookups = Object.keys(
          projProcCfg.Project.ApplicationResolvers || {},
        );

        appGraph![projProcCfg.ProjectLookup] = appLookups
          .map((appLookup) => {
            if (!isEverythingAsCodeApplications(this.EaC)) {
              // This will never happen, check is just to get proper typing
              throw new Error();
            }

            const app = this.EaC!.Applications![appLookup];

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
              Pattern: new URLPattern({ pathname: resolverCfg.PathPattern }),
              Revision: this.Revision,
            } as EaCApplicationProcessorConfig;
          })
          .sort((a, b) => {
            return b.ResolverConfig.Priority - a.ResolverConfig.Priority;
          });

        const appProcCfgCalls = appGraph![projProcCfg.ProjectLookup].map(
          async (appProcCfg) => {
            if (!isEverythingAsCodeApplications(this.EaC)) {
              // This will never happen, check is just to get proper typing
              throw new Error();
            }

            const pipeline = await this.constructPipeline(
              projProcCfg.Project,
              appProcCfg.Application,
              this.EaC!.Modifiers || {},
            );

            pipeline.Append(await this.establishApplicationHandler(appProcCfg));

            appProcCfg.Handlers = pipeline;
          },
        );

        await Promise.all(appProcCfgCalls);
      });

      await Promise.all(projProcCfgCalls);
    }

    return appGraph;
  }

  protected buildProjectGraph(): EaCProjectProcessorConfig[] {
    const projGraph: EaCProjectProcessorConfig[] = [];

    if (isEverythingAsCodeApplications(this.EaC) && this.EaC!.Projects) {
      const projLookups = Object.keys(this.EaC?.Projects || {});

      const procCfgs: EaCProjectProcessorConfig[] = projLookups
        .map((projLookup) => {
          if (!isEverythingAsCodeApplications(this.EaC)) {
            // This will never happen, check is just to get proper typing
            throw new Error();
          }

          const proj = this.EaC!.Projects![projLookup]!;

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

  protected override async configureRuntimeRouteMatrix(): Promise<
    EaCRuntimeHandlerRouteGroup[]
  > {
    let projGraph = this.buildProjectGraph();

    const appGraph = await this.buildApplicationGraph(projGraph);

    projGraph = projGraph.map((projProcCfg) => {
      return {
        ...projProcCfg,
        Handler: this.establishProjectHandler(projProcCfg, appGraph),
      };
    });

    const handler: EaCRuntimeHandler = (req, ctx) => {
      const projProcessorConfig = projGraph!.find((node) => {
        return node.Patterns.some((pattern) => pattern.test(req.url));
      });

      if (!projProcessorConfig) {
        throw new Error(`No project is configured for '${req.url}'.`);
      }

      ctx = merge(ctx, {
        Runtime: {
          ProjectProcessorConfig: projProcessorConfig,
        },
      } as EaCApplicationsRuntimeContext);

      return projProcessorConfig.Handler(req, ctx);
    };

    return [{
      Routes: [{
        Route: "*",
        Handler: handler,
        Name: "project",
      }],
    }];
  }

  protected override async configurationFinalization(): Promise<void> {
    const esbuild = await this.IoC.Resolve<ESBuild>(
      this.IoC!.Symbol("ESBuild"),
    );

    esbuild!.stop();
  }

  protected override async configurationSetup(): Promise<void> {
    let esbuild: ESBuild | undefined;

    try {
      esbuild = await this.IoC.Resolve<ESBuild>(this.IoC!.Symbol("ESBuild"));
    } catch {
      esbuild = undefined;
    }

    if (!esbuild) {
      if (IS_DENO_DEPLOY()) {
        esbuild = await import("npm:esbuild-wasm@0.23.1");

        this.logger.debug("Initialized esbuild with portable WASM.");
      } else {
        esbuild = await import("npm:esbuild@0.23.1");

        this.logger.debug("Initialized esbuild with standard build.");
      }

      try {
        const worker = IS_DENO_DEPLOY() ? false : undefined;

        await esbuild!.initialize({
          worker,
        });
      } catch (err) {
        this.logger.error("There was an issue initializing esbuild", err);

        // throw err;
      }

      this.IoC.Register<ESBuild>(() => esbuild!, {
        Type: this.IoC!.Symbol("ESBuild"),
      });
    }
  }

  protected async constructPipeline(
    project: EaCProjectAsCode,
    application: EaCApplicationAsCode,
    modifiers: Record<string, EaCModifierAsCode | null>,
  ): Promise<EaCRuntimeHandlerPipeline> {
    let pipelineModifierResolvers: Record<
      string,
      EaCModifierResolverConfiguration
    > = {};

    // TODO(mcgear): Add application logic middlewares to pipeline

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

    const defaultModifierMiddlewareResolver = await this.IoC.Resolve<
      ModifierHandlerResolver
    >(
      this.IoC.Symbol("ModifierHandlerResolver"),
    );

    for (const mod of pipelineModifiers) {
      pipeline.Append(
        await defaultModifierMiddlewareResolver.Resolve(this.IoC, mod),
      );
    }

    return pipeline;
  }

  protected async establishApplicationHandler(
    appProcessorConfig: EaCApplicationProcessorConfig,
  ): Promise<EaCRuntimeHandler> {
    const defaultProcessorHandlerResolver = await this.IoC.Resolve<
      ProcessorHandlerResolver
    >(
      this.IoC.Symbol("ProcessorHandlerResolver"),
    );

    let handler = await defaultProcessorHandlerResolver.Resolve(
      this.IoC,
      appProcessorConfig,
      this.EaC!,
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

  protected establishProjectHandler(
    projProcessorConfig: EaCProjectProcessorConfig,
    appGraph: Record<string, EaCApplicationProcessorConfig[]>,
  ): EaCRuntimeHandler {
    return (req, ctx) => {
      const appProcessorConfig = appGraph![
        projProcessorConfig.ProjectLookup
      ].find((node) => {
        const appResolverConfig =
          projProcessorConfig.Project.ApplicationResolvers[
            node.ApplicationLookup
          ];

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

        return node.Pattern.test(req.url) && isAllowedMethod && matchesRegex;
      });

      if (!appProcessorConfig) {
        throw new Error(
          `No application is configured for '${req.url}' in project '${projProcessorConfig.ProjectLookup}'.`,
        );
      }

      ctx = merge(ctx, {
        Runtime: {
          ApplicationProcessorConfig: appProcessorConfig,
        },
      } as EaCApplicationsRuntimeContext);

      ctx.Runtime.URLMatch = buildURLMatch(
        new URLPattern({
          pathname: appProcessorConfig.ResolverConfig.PathPattern,
        }),
        req,
      );

      return appProcessorConfig.Handlers.Execute(req, ctx);
    };
  }
}
