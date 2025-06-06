// deno-lint-ignore-file no-explicit-any
import {
  ComponentType,
  DenoConfig,
  denoPlugins,
  DFSFileHandler,
  DistributedFileSystemOptions,
  EAC_RUNTIME_DEV,
  EaCDistributedFileSystemAsCode,
  EaCDistributedFileSystemDetails,
  EaCPreactAppProcessor,
  EaCRuntimeContext,
  EaCRuntimeHandler,
  EaCRuntimeHandlerPipeline,
  EaCRuntimeHandlerSet,
  ESBuild,
  ESBuildContext,
  ESBuildOnLoadArgs,
  ESBuildOnLoadResult,
  ESBuildOnResolveArgs,
  ESBuildOnResolveResult,
  ESBuildOptions,
  ESBuildPlugin,
  ESBuildPluginBuild,
  ESBuildResult,
  executePathMatch,
  importDFSTypescriptModule,
  IoCContainer,
  IS_DENO_DEPLOY,
  loadDenoConfigSync,
  loadDFSFileHandler,
  loadMiddleware,
  loadRequestPathPatterns,
  Logger,
  parseJsonc,
  path,
  PathMatch,
} from "./.deps.ts";
import { loadClientScript } from "./islands/loadClientScript.ts";
import { loadLayout } from "./loadLayout.ts";
import { loadPreactAppHandler } from "./loadPreactAppHandler.ts";
import { PreactRenderHandler } from "./PreactRenderHandler.ts";
import { EaCComponentDFSHandler } from "./EaCComponentDFSHandler.ts";
import { EaCApplicationProcessorConfig } from "../applications/processors/.exports.ts";

export class EaCPreactAppHandler {
  //#region Fields
  protected configured: Map<string, boolean>;

  protected contexts: Map<string, ESBuildContext<ESBuildOptions>>;

  protected denoCfg: DenoConfig;

  protected denoJsonPath: string;

  protected dfsHandlers: Map<string, DFSFileHandler>;

  protected dfsIslands: Map<string, [string, ComponentType, boolean, string][]>;

  protected files: Map<string, Record<string, string>>;

  protected hasChanges: Map<string, boolean>;

  protected isDev: boolean;

  protected pipelines: Map<string, EaCRuntimeHandlerPipeline>;
  //#endregion

  //#region Properties
  //#endregion

  //#region Constructors
  constructor(
    protected ioc: IoCContainer,
    protected logger: Logger,
    protected renderHandler: PreactRenderHandler,
    protected eacIslandsClientPath: string,
    protected eacIslandsClientDepsPath: string,
    protected importMap?: Record<string, string>,
    protected options: Partial<ESBuildOptions> = {},
  ) {
    this.configured = new Map();

    this.contexts = new Map();

    this.dfsHandlers = new Map();

    this.dfsIslands = new Map();

    this.files = new Map();

    this.hasChanges = new Map();

    this.pipelines = new Map();

    this.denoJsonPath = path.join(Deno.cwd(), "./deno.jsonc");

    const { Config } = loadDenoConfigSync();

    this.denoCfg = Config;

    // this.denoJsonPath = DenoConfigPath;

    this.isDev = EAC_RUNTIME_DEV();
  }
  //#endregion

  //#region API Methods
  public async Build(
    processor: EaCPreactAppProcessor,
    importMap?: Record<string, string>,
    options: Partial<ESBuildOptions> = {},
  ): Promise<void> {
    if (
      !this.configured.get(processor.AppDFSLookup) ||
      processor.ComponentDFSLookups?.some(
        ([compDFSLookup]) => !this.configured.get(compDFSLookup),
      )
    ) {
      throw new Deno.errors.InvalidData(
        `You must call the 'Configure()' method before building.`,
      );
    }

    importMap = this.loadImportMap(importMap);

    const bundle = await this.buildIslandsClient(
      processor,
      options,
      {}, //islandFiles,
      importMap,
    );

    this.establishBundleHandler(processor, bundle);

    this.hasChanges.set(processor.AppDFSLookup, false);
  }

  public async Configure(
    appProcCfg: EaCApplicationProcessorConfig,
    dfss: Record<string, EaCDistributedFileSystemAsCode>,
    dfsOptions: DistributedFileSystemOptions,
    revision: string,
  ): Promise<void> {
    const matches = await this.loadPathMatches(
      appProcCfg,
      dfss,
      dfsOptions,
      revision,
    );

    this.establishPipeline(appProcCfg, matches);
  }

  public Execute(
    processor: EaCPreactAppProcessor,
    request: Request,
    ctx: EaCRuntimeContext,
  ): Response | Promise<Response> {
    const pipeline = this.pipelines.get(processor.AppDFSLookup)!;

    return pipeline.Execute(request, ctx);
  }
  //#endregion

  //#region Helpers
  // protected async buildCompIslandsLibrary(
  //   options: Partial<ESBuildOptions>,
  //   importMap?: Record<string, string>,
  // ): Promise<Record<string, string>> {
  //   const esbuild = await this.ioc.Resolve<ESBuild>(this.ioc.Symbol('ESBuild'));

  //   const buildCalls = Array.from(this.dfsIslands.entries()).map(
  //     async ([compDFSLookup, compDFSs]) => {
  //       const entryPoints = compDFSs
  //         .map(([compPath, _comp, isIsland, _contents]) => isIsland ? compPath : undefined)
  //         .filter((ep) => ep)
  //         .map((ep) => ep!);

  //       const compDFSHandler = this.dfsHandlers.get(compDFSLookup)!;

  //       const absWorkingDir = path.join(
  //         !IS_DENO_DEPLOY() ? Deno.cwd() : '/',
  //         compDFSHandler.Root || '',
  //       );

  //       const buildOptions: ESBuildOptions = {
  //         ...this.loadDefaultBuildOptions(
  //           compDFSLookup,
  //           true,
  //           {},
  //           compDFSHandler.Root,
  //           importMap,
  //         ),
  //         entryPoints: entryPoints,
  //         absWorkingDir,
  //         ...options,
  //         sourcemap: false,
  //       };

  //       const context = !this.contexts.has(compDFSLookup) ||
  //           this.hasChanges.get(compDFSLookup)
  //         ? await esbuild.context(buildOptions)
  //         : this.contexts.get(compDFSLookup)!;

  //       const bundle = await context.rebuild();

  //       bundle.outputFiles = bundle.outputFiles!.map((outFile) => {
  //         if (outFile.path.startsWith(Deno.cwd())) {
  //           const pathUrl = new URL(
  //             outFile.path.substring(Deno.cwd().length),
  //             'http://not-used.com',
  //           );

  //           outFile.path = pathUrl.pathname;
  //         }

  //         return outFile;
  //       });

  //       return bundle.outputFiles.reduce((fs, outFile) => {
  //         fs[outFile.path] = outFile.text;

  //         return fs;
  //       }, {} as Record<string, string>);
  //     },
  //   );

  //   const builtIslands = await Promise.all(buildCalls);

  //   return builtIslands.reduce((fs, dfsIslands) => {
  //     return {
  //       ...fs,
  //       ...dfsIslands,
  //     };
  //   }, {} as Record<string, string>);
  // }

  protected async buildIslandsClient(
    processor: EaCPreactAppProcessor,
    options: Partial<ESBuildOptions>,
    islandLibraryFiles: Record<string, string>,
    importMap?: Record<string, string>,
  ): Promise<ESBuildResult<ESBuildOptions>> {
    const esbuild = await this.ioc.Resolve<ESBuild>(this.ioc.Symbol("ESBuild"));

    const appDFSHandler = this.dfsHandlers.get(processor.AppDFSLookup)!;

    const absWorkingDir = path.join(
      !IS_DENO_DEPLOY() ? Deno.cwd() : "/",
      appDFSHandler.Root || "",
    );

    this.logger.debug(`ESBuild working directory: ${absWorkingDir}`);

    const clientSrcPath = `./${this.eacIslandsClientPath.split("/").pop()!}`;

    const buildOptions: ESBuildOptions = {
      ...this.loadDefaultBuildOptions(
        processor.AppDFSLookup,
        false,
        islandLibraryFiles,
        appDFSHandler.Root,
        importMap,
      ),
      entryPoints: [clientSrcPath],
      absWorkingDir,
      ...options,
    };

    const context = !this.contexts.has(processor.AppDFSLookup) ||
        this.hasChanges.get(processor.AppDFSLookup)
      ? await esbuild.context(buildOptions)
      : this.contexts.get(processor.AppDFSLookup)!;

    const bundle = await context.rebuild();

    bundle.outputFiles = bundle.outputFiles!.map((outFile) => {
      if (outFile.path.startsWith(Deno.cwd())) {
        const pathUrl = new URL(
          outFile.path.substring(Deno.cwd().length),
          "http://not-used.com",
        );

        outFile.path = pathUrl.pathname;
      }

      return outFile;
    });

    return bundle;
  }

  protected async componentLoader(
    handlers: (EaCComponentDFSHandler | undefined)[],
    revision: string,
  ): Promise<[string, ComponentType, boolean, string][][] | undefined> {
    const compDFSHandlers = handlers.filter((cdh) => cdh).map((cdh) => cdh!);

    if (compDFSHandlers) {
      const compDFSCalls = compDFSHandlers.map(
        async ({ DFS, DFSLookup, Handler, Extensions }) => {
          const compDFS = await this.loadCompDFS(
            DFS,
            DFSLookup,
            Handler,
            Extensions,
            revision,
          );

          if (compDFS?.length > 0) {
            await this.setupCompIslandsLibrarySource(DFSLookup, compDFS);
          }

          this.dfsIslands.set(DFSLookup, compDFS);

          return compDFS;
        },
      );

      const compDFSs = await Promise.all(compDFSCalls);

      // const components = compDFSs.filter((c) => c) as [
      //   string,
      //   ComponentType<any>,
      //   boolean,
      //   string
      // ][];
      this.logger.debug("Components:");
      compDFSs.forEach((n) => {
        n.forEach((m) => this.logger.debug(`\t${m[0]}`));
      });
      this.logger.debug("");

      return compDFSs;
    }
  }

  protected establishBundleHandler(
    processor: EaCPreactAppProcessor,
    bundle: ESBuildResult<ESBuildOptions>,
  ): void {
    const bundleHandler: EaCRuntimeHandler = (_req, ctx) => {
      const file = bundle.outputFiles!.find((outFile) => {
        return ctx.Runtime.URLMatch.Path.endsWith(outFile.path);
      });

      if (file) {
        return new Response(file.text, {
          headers: {
            "cache-control": `public, max-age=${60 * 60 * 24 * 365}, immutable`,
            "Content-Type": "application/javascript",
            ETag: file.hash,
          },
        });
      }

      return ctx.Next();
    };

    const pipeline = this.pipelines.get(processor.AppDFSLookup)!;

    pipeline.Prepend(bundleHandler);
  }

  protected establishPipeline(
    appProcCfg: EaCApplicationProcessorConfig,
    matches: PathMatch[],
  ): void {
    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    const pipeline = new EaCRuntimeHandlerPipeline();

    pipeline.Append((req, ctx) => {
      return executePathMatch(matches, req, ctx, "text/html; charset=utf-8");
    });

    this.pipelines.set(processor.AppDFSLookup, pipeline);
  }

  protected async loadComponent(
    compPath: string,
    compDFS: EaCDistributedFileSystemDetails,
    compDFSLookup: string,
    componentFileHandler: DFSFileHandler,
  ): Promise<[string, ComponentType, boolean, string] | undefined> {
    const compModule = await importDFSTypescriptModule(
      this.logger,
      componentFileHandler,
      compPath,
      compDFS,
      compDFSLookup,
      "tsx",
    );

    if (compModule) {
      const { filePath, module, contents } = compModule;

      const comp: ComponentType | undefined = module.default;

      if (comp) {
        const isCompIsland = "IsIsland" in module ? module.IsIsland : false;

        return [filePath, comp, isCompIsland, contents];
      }
    }

    return undefined;
  }

  protected async layoutLoader(
    appProcCfg: EaCApplicationProcessorConfig,
    allPaths: string[],
    appDFS: EaCDistributedFileSystemDetails,
    appDFSLookup: string,
    appDFSHandler: DFSFileHandler,
  ): Promise<
    [
      string,
      ComponentType<any>,
      boolean,
      string,
      EaCRuntimeHandlerSet,
      string[] | undefined,
    ][]
  > {
    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    const layoutPaths = allPaths
      .filter((p) => p.endsWith("_layout.tsx"))
      .sort((a, b) => a.split("/").length - b.split("/").length);

    const layoutCalls = layoutPaths.map((p) => {
      return loadLayout(this.logger, appDFSHandler, p, appDFS, appDFSLookup);
    });

    const layouts = await Promise.all(layoutCalls);

    layouts.forEach(([root, layout, isIsland, contents]) => {
      if (isIsland) {
        this.renderHandler.AddIsland(layout, `${root}/_layout.tsx`, contents);
      }
    });

    this.logger.debug(`Layouts - ${processor.AppDFSLookup}: `);
    layouts
      .map(
        (l) =>
          `${appProcCfg.ResolverConfig.PathPattern.replace("*", "")}${
            l[0].startsWith(".") ? l[0].slice(1) : l[0]
          }`,
      )
      .forEach((pt) => this.logger.debug(`\t${pt}`));
    this.logger.debug("");

    return layouts;
  }

  protected async loadAppDFSHandler(
    processor: EaCPreactAppProcessor,
    dfss: Record<string, EaCDistributedFileSystemAsCode>,
    dfsOptions: DistributedFileSystemOptions,
  ): Promise<{
    DFS: EaCDistributedFileSystemDetails;
    Handler: DFSFileHandler;
  }> {
    const appDFSHandler = await loadDFSFileHandler(
      this.ioc,
      dfss,
      dfsOptions,
      processor.AppDFSLookup,
    );

    if (!appDFSHandler) {
      throw new Deno.errors.NotFound(
        `The DFS file handler for application DFS '${processor.AppDFSLookup}' is missing, please make sure to add it to your configuration.`,
      );
    }

    this.dfsHandlers.set(processor.AppDFSLookup, appDFSHandler);

    return {
      DFS: dfss[processor.AppDFSLookup].Details!,
      Handler: appDFSHandler,
    };
  }

  protected async loadCompDFS(
    dfs: EaCDistributedFileSystemDetails,
    dfsLookup: string,
    componentFileHandler: DFSFileHandler,
    extensions: string[],
    revision: string,
  ): Promise<[string, ComponentType, boolean, string][]> {
    const compPaths = await componentFileHandler.LoadAllPaths(revision);

    const compCalls = compPaths
      .filter((cp) => extensions.some((ext) => cp.endsWith(`.${ext}`)))
      .map((compPath) =>
        this.loadComponent(compPath, dfs, dfsLookup, componentFileHandler)
      );

    const compResults = await Promise.all(compCalls);

    const comps = compResults?.filter((c) => c).map((c) => c!);

    return comps;
  }

  protected async loadComponentDFSHandlers(
    processor: EaCPreactAppProcessor,
    dfss: Record<string, EaCDistributedFileSystemAsCode>,
    dfsOptions: DistributedFileSystemOptions,
  ): Promise<(EaCComponentDFSHandler | undefined)[] | undefined> {
    if (!processor.ComponentDFSLookups) {
      return undefined;
    }

    const componentDFSCalls = processor.ComponentDFSLookups.map(
      async ([compDFSLookup, extensions]) => {
        const compFileHandler = await loadDFSFileHandler(
          this.ioc,
          dfss,
          dfsOptions,
          compDFSLookup,
        );

        if (!compFileHandler) {
          this.logger.warn(
            `The DFS file handler for component DFS '${compDFSLookup}' is missing, please make sure to add it to your configuration.`,
          );

          return undefined;
        }

        this.dfsHandlers.set(compDFSLookup, compFileHandler);

        return {
          DFS: dfss[compDFSLookup].Details,
          DFSLookup: compDFSLookup,
          Handler: compFileHandler,
          Extensions: extensions,
        } as EaCComponentDFSHandler;
      },
    );

    const componentDFSs = await Promise.all(componentDFSCalls);

    return componentDFSs;
  }

  protected loadDefaultBuildOptions(
    dfsLookup: string,
    preserveRemotes: boolean,
    extraFiles: Record<string, string> = {},
    relativeRoot?: string,
    importMap?: Record<string, string>,
  ): ESBuildOptions {
    const jsx = this.denoCfg.compilerOptions?.jsx;

    const jsxFactory = this.denoCfg.compilerOptions?.jsxFactory;

    const jsxFragmentFactory = this.denoCfg.compilerOptions?.jsxFragmentFactory;

    const jsxImportSrc = this.denoCfg.compilerOptions?.jsxImportSource;

    const minifyOptions: Partial<ESBuildOptions> = this.isDev
      ? {
        minifyIdentifiers: false,
        minifySyntax: false, //true,
        minifyWhitespace: false, //true,
      }
      : { minify: true };

    let files = this.files.get(dfsLookup) || {};

    files = {
      ...files,
      ...extraFiles,
    };

    return {
      platform: "browser",
      format: "esm",
      target: ["chrome99", "firefox99", "safari15"],
      sourcemap: this.isDev ? "linked" : false,
      write: false,
      metafile: true,
      bundle: true,
      splitting: !this.isDev,
      treeShaking: true,
      // TODO(mcgear): Need to make this configurable per Preact App Processor: processor.Externals
      // external: ['path'],
      jsx: jsx === "react"
        ? "transform"
        : jsx === "react-native" || jsx === "preserve"
        ? "preserve"
        : !jsxImportSrc
        ? "transform"
        : "automatic",
      jsxImportSource: jsxImportSrc ?? "preact",
      jsxFactory: jsxFactory ?? "EaC_h",
      jsxFragment: jsxFragmentFactory ?? "EaC_Fragment",
      ...minifyOptions,
      plugins: [
        EaCPreactAppHandler.ConfigurePlugin(
          this,
          files,
          preserveRemotes,
          relativeRoot,
          importMap,
        ),
        ...denoPlugins({ configPath: this.denoJsonPath }),
      ],
      ...this.options,
    };
  }

  protected loadImportMap(
    importMap?: Record<string, string>,
  ): Record<string, string> {
    return {
      ...this.denoCfg.imports,
      ...(this.importMap || {}),
      ...(importMap || {}),
    };
  }

  protected async loadPathMatches(
    appProcCfg: EaCApplicationProcessorConfig,
    dfss: Record<string, EaCDistributedFileSystemAsCode>,
    dfsOptions: DistributedFileSystemOptions,
    revision: string,
  ): Promise<PathMatch[]> {
    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    const [{ DFS: appDFS, Handler: appDFSHandler }, compDFSHandlers] =
      await Promise.all([
        this.loadAppDFSHandler(processor, dfss, dfsOptions),
        this.loadComponentDFSHandlers(processor, dfss, dfsOptions),
      ]);

    const matches = await loadRequestPathPatterns(
      appDFSHandler,
      appDFS,
      async (allPaths) => {
        const [middleware, layouts, compDFSs] = await Promise.all([
          this.middlewareLoader(
            appProcCfg,
            allPaths,
            appDFS,
            processor.AppDFSLookup,
            appDFSHandler,
          ),
          this.layoutLoader(
            appProcCfg,
            allPaths,
            appDFS,
            processor.AppDFSLookup,
            appDFSHandler,
          ),
          compDFSHandlers
            ? this.componentLoader(compDFSHandlers, revision)
            : Promise.resolve([]),
        ]);

        return { middleware, layouts, compDFSs };
      },
      async (filePath, { layouts }) => {
        return await loadPreactAppHandler(
          this.logger,
          this.ioc,
          processor,
          appDFSHandler,
          filePath,
          appDFS,
          layouts,
          this.renderHandler,
        );
      },
      (filePath, pipeline, { middleware }) => {
        const reqMiddleware = middleware
          .filter(([root]) => {
            return filePath.startsWith(root);
          })
          .flatMap(([_root, handler]) =>
            Array.isArray(handler) ? handler : [handler]
          );

        pipeline.Prepend(...reqMiddleware);
      },
      revision,
    );

    this.logger.debug(`Apps - ${processor.AppDFSLookup}: `);
    matches.forEach((m) =>
      this.logger.debug(
        `\t${
          appProcCfg.ResolverConfig.PathPattern.replace("*", "")
        }${m.PatternText}`,
      )
    );
    this.logger.debug("");

    await this.setupIslandsClientSources(processor, appDFSHandler.Root);

    return matches;
  }

  protected async middlewareLoader(
    appProcCfg: EaCApplicationProcessorConfig,
    allPaths: string[],
    appDFS: EaCDistributedFileSystemDetails,
    appDFSLookup: string,
    appDFSHandler: DFSFileHandler,
  ): Promise<[string, EaCRuntimeHandlerSet][]> {
    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    const middlewarePaths = allPaths
      .filter((p) => p.endsWith("_middleware.ts"))
      .sort((a, b) => a.split("/").length - b.split("/").length);

    const middlewareCalls = middlewarePaths.map((p) => {
      return loadMiddleware(
        this.logger,
        appDFSHandler,
        p,
        appDFS,
        appDFSLookup,
      );
    });

    const middleware = (await Promise.all(middlewareCalls))
      .filter((m) => m)
      .map((m) => m!);

    this.logger.debug(`Middleware - ${processor.AppDFSLookup}: `);
    middleware
      .map(
        (l) =>
          `${appProcCfg.ResolverConfig.PathPattern.replace("*", "")}${
            l[0].startsWith(".") ? l[0].slice(1) : l[0]
          }`,
      )
      .forEach((pt) => this.logger.debug(`\t${pt}`));
    this.logger.debug("");

    return middleware;
  }

  protected setupCompIslandsLibrarySource(
    dfsLookup: string,
    comps: [string, ComponentType, boolean, string][],
  ): Promise<void> {
    comps.forEach(([compPath, comp, isIsland, contents]) => {
      if (isIsland) {
        this.renderHandler.AddIsland(comp, compPath, contents);
      }
    });

    const librarySource = comps.reduce(
      (fs, [compPath, _comp, _isIsland, contents]) => {
        fs[compPath] = contents;

        return fs;
      },
      {} as Record<string, string>,
    );

    this.files.set(dfsLookup, {
      ...librarySource,
    });

    this.configured.set(dfsLookup, true);

    return Promise.resolve();
  }

  protected async setupIslandsClientSources(
    processor: EaCPreactAppProcessor,
    appDFSRoot: string,
  ): Promise<void> {
    const esbuild = await this.ioc.Resolve<ESBuild>(this.ioc.Symbol("ESBuild"));

    // TODO(mcgear): Move client.deps.ts resolution to per request with revision cache so
    //    that only the islands used per request are shipped to the client
    let [clientScript, clientDepsScript] = await Promise.all([
      loadClientScript(esbuild, this.eacIslandsClientPath, "tsx"),
      loadClientScript(esbuild, this.eacIslandsClientDepsPath, "ts"),
    ]);

    const clientSrcPath = `./${this.eacIslandsClientPath.split("/").pop()!}`;

    const clientDepsSrcPath = `./${this.eacIslandsClientDepsPath
      .split("/")
      .pop()!}`;

    const islands = this.renderHandler.LoadIslands();

    const islandNamePaths = Object.keys(islands).map((islandPath) => [
      islands[islandPath][0],
      islandPath.startsWith("file:///")
        ? path
          .relative(
            path.join(Deno.cwd(), appDFSRoot),
            islandPath.replace("file:///", ""),
          )
          .replace(/\\/g, "/")
        : islandPath,
    ]);

    const clientDepsImports = islandNamePaths.map(
      ([islandName, islandPath]) =>
        `import ${islandName} from '${islandPath}';`,
    );

    clientDepsScript = clientDepsImports
      ? clientDepsImports.join("\n") + `\n${clientDepsScript}`
      : clientDepsScript;

    const islandCompMaps = islandNamePaths.map(
      ([islandName]) => `componentMap.set('${islandName}', ${islandName});`,
    );

    clientDepsScript += "\n" + islandCompMaps.join("\n");

    this.files.set(processor.AppDFSLookup, {
      ...{
        [clientSrcPath]: clientScript,
        [clientDepsSrcPath]: clientDepsScript,
      },
      // ...islandContents,
    });

    this.configured.set(processor.AppDFSLookup, true);
  }
  //#endregion

  //#region Plugin
  static ConfigurePlugin(
    builder: EaCPreactAppHandler,
    files: Record<string, string>,
    preserveRemotes: boolean,
    relativeRoot?: string,
    importMap?: Record<string, string>,
  ): ESBuildPlugin {
    return {
      name: "EaCPreactAppHandler",
      setup(build) {
        // build.onLoad({ filter: /.*/ }, (args) => {
        //   return null;
        // });

        // build.onResolve({ filter: /.*/ }, (args) => {
        //   if (args.path === '@lezer/highlight' && first) {
        //     console.log('@lezer/highlight');
        //     console.log(args);
        //     first = false;
        //   }
        //   return null;
        // });

        build.onLoad({ filter: /\.json$/ }, async (args) => {
          let content: string;

          if (args.path.startsWith("//")) {
            args.path = args.path.replace("//", "https://");
          }

          // Determine if the file is remote or local
          if (
            args.path.startsWith("http://") ||
            args.path.startsWith("https://")
          ) {
            // Fetch remote JSONc file
            const response = await fetch(args.path);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch remote JSONc file: ${response.statusText}`,
              );
            }
            content = await response.text();
          } else {
            // Read local JSONc file
            content = await Deno.readTextFile(args.path);
          }

          // Parse the content as JSONc (allowing comments)
          const jsonContent = parseJsonc(content);

          // Return the transformed content as JSON
          return {
            contents: JSON.stringify(jsonContent),
            loader: "json",
          };
        });

        build.onLoad({ filter: /^(http|https|file)\:\/\/.+/ }, (args) => {
          return builder.LoadFetchFile(args);
        });

        build.onLoad({ filter: /.*/, namespace: "$" }, (args) => {
          return builder.LoadVirtualFile(args, files);
        });

        build.onResolve({ filter: /.*/, namespace: "$" }, (args) => {
          return builder.ResolveImportMapFile(
            () => build,
            args,
            preserveRemotes,
            importMap,
          );
        });

        build.onResolve({ filter: /.*/, namespace: "file" }, (args) => {
          return builder.ResolveImportMapFile(
            () => build,
            args,
            preserveRemotes,
            importMap,
          );
        });

        build.onResolve({ filter: /.*/ }, (args) => {
          return builder.ResolveVirtualFile(args, files);
        });

        build.onResolve(
          { filter: /^(jsr:|npm:|node:).*/, namespace: "$" },
          (args) => {
            return builder.ResolveSpecifierFile(() => build, args);
          },
        );

        build.onResolve({ filter: /^(http|https)\:\/\/.+/ }, (args) => {
          return builder.ResolveRemoteFile(args, preserveRemotes);
        });

        build.onResolve({ filter: /^(\.\/|\.\.\/.+)/ }, (args) => {
          return builder.ResolveRelativeFile(
            args,
            preserveRemotes,
            relativeRoot,
          );
        });
      },
    };
  }

  public async LoadFetchFile(
    args: ESBuildOnLoadArgs,
  ): Promise<ESBuildOnLoadResult | null> {
    if (
      args.namespace === "http" ||
      args.namespace === "https" ||
      args.namespace === "remote"
    ) {
      // console.debug(`Loading fetch file: ${args.path}`);

      const resp = await fetch(args.path, {
        redirect: "follow",
      });

      const contents = await resp.text();

      const res = this.prependJSXParts(args.path, contents);

      return res;
    }

    return null;
  }

  public LoadVirtualFile(
    args: ESBuildOnLoadArgs,
    files: Record<string, string>,
  ): ESBuildOnLoadResult | null {
    if (args.namespace === "$" && args.path in files) {
      // console.debug(`Loading virtual file: ${args.path}`);

      const filePath = args.path;

      const contents = files[filePath];

      const res = this.prependJSXParts(filePath, contents);

      return res;
    }

    return null;
  }

  public async ResolveImportMapFile(
    build: () => ESBuildPluginBuild,
    args: ESBuildOnResolveArgs,
    preserveRemotes: boolean,
    importMap?: Record<string, string>,
  ): Promise<ESBuildOnResolveResult | null> {
    let filePath: string | undefined;

    const fullImportMap = this.loadImportMap(importMap);

    const importKeys = Object.keys(fullImportMap || {});

    if (importKeys.includes(args.path)) {
      filePath = this.denoCfg.imports![args.path];
    } else if (
      importKeys.some((imp) => imp.endsWith("/") && args.path.startsWith(imp))
    ) {
      const importPath = importKeys.find(
        (imp) => imp.endsWith("/") && args.path.startsWith(imp),
      )!;

      filePath = this.denoCfg.imports![importPath] +
        args.path.replace(importPath, "");
    }

    if (filePath === "node:buffer") {
      throw new Error("node:buffer");
    }

    if (filePath) {
      // console.debug(`Resolving import map file: ${args.path}`);

      if (
        filePath.startsWith("npm:") ||
        filePath.startsWith("jsr:") ||
        filePath.startsWith("node:")
      ) {
        return await this.ResolveSpecifierFile(build, {
          kind: args.kind,
          path: filePath,
          importer: args.importer,
          // resolveDir: args.resolveDir,
        } as ESBuildOnResolveArgs);
      } else {
        try {
          if (filePath) {
            const [type, pkg] = filePath.split(":");

            if (type === "file") {
              filePath = new URL(path.join(Deno.cwd(), filePath)).href;
            }

            return {
              path: (preserveRemotes || type === "file" ? filePath : pkg)
                .replace("//", "/"),
              namespace: type,
              external: preserveRemotes,
            };
          }
        } finally {
          if (filePath) {
            // console.debug(`\t${filePath}`);
          }
        }
      }
    }

    return null;
  }

  public ResolveRelativeFile(
    args: ESBuildOnResolveArgs,
    preserveRemotes: boolean,
    relativeRoot?: string,
  ): ESBuildOnResolveResult | null {
    if (args.path.startsWith("./") || args.path.startsWith("../")) {
      // console.debug(`Resolving relative file: ${args.path}`);

      if (args.importer.startsWith("//")) {
        args.importer = `https:${args.importer}`;
      } else if (
        relativeRoot &&
        (args.importer.startsWith("./") || args.importer.startsWith("../"))
      ) {
        if (relativeRoot.startsWith("./") || relativeRoot.startsWith("../")) {
          relativeRoot = new URL(
            relativeRoot,
            new URL(`file:///${Deno.cwd()}/`),
          ).href;
        }

        const importerURL = new URL(args.importer, relativeRoot);

        args.importer = importerURL.href;
      }

      if (
        args.importer.startsWith("http://") ||
        args.importer.startsWith("https://")
      ) {
        const fileURL = new URL(args.path, args.importer);

        const [type, pkg] = fileURL.href.split(":");

        return {
          path: preserveRemotes ? fileURL.href : pkg,
          namespace: type,
          external: preserveRemotes,
        };
      } else if (args.importer.startsWith("file:///")) {
        const fileURL = new URL(args.path, args.importer);

        return {
          path: fileURL.href,
          namespace: "remote",
          external: preserveRemotes,
        };
      }
    }

    return null;
  }

  public ResolveRemoteFile(
    args: ESBuildOnResolveArgs,
    preserveRemotes: boolean,
  ): ESBuildOnResolveResult | null {
    if (args.path.startsWith("http://") || args.path.startsWith("https://")) {
      // console.debug(`Resolving remote file: ${args.path}`);

      const [type, pkg] = args.path.split(":");

      return {
        path: preserveRemotes ? args.path : pkg,
        namespace: type,
        external: preserveRemotes,
      };
    }

    return null;
  }

  public async ResolveSpecifierFile(
    build: () => ESBuildPluginBuild,
    args: ESBuildOnResolveArgs,
  ): Promise<ESBuildOnResolveResult | null> {
    const [namespace, ...path] = args.path.split(":");

    return await build().resolve(path.join(":"), {
      namespace,
      kind: args.kind,
      // importer: args.importer,
      // resolveDir: args.resolveDir,
    });

    // return {
    //   // path: args.path,
    //   path: path.join(':'),
    //   namespace,
    // } as ESBuildOnResolveResult;
  }

  public ResolveVirtualFile(
    args: ESBuildOnResolveArgs,
    files: Record<string, string>,
  ): ESBuildOnResolveResult | null {
    if (args.path in files) {
      // console.debug(`Resolving virtual file: ${args.path}`);

      return {
        path: args.path,
        namespace: "$",
      };
    }

    return null;
  }

  protected prependJSXParts(
    filePath: string,
    contents: string,
  ): ESBuildOnLoadResult {
    const loader = filePath.endsWith(".tsx")
      ? "tsx"
      : filePath.endsWith(".js")
      ? "jsx"
      : "ts";

    if (loader === "tsx" || loader === "jsx") {
      contents =
        `import { Fragment as EaC_Fragment, h as EaC_h } from "preact";\n${contents}`;
    }

    return { contents, loader };
  }
}
