// deno-lint-ignore-file no-explicit-any
import { importDFSTypescriptModule } from "jsr:@fathym/eac@0.2.106/dfs/utils";
import matter from "npm:gray-matter@4.0.3";
import { toText } from "jsr:@std/streams@^1.0.9";
import { EaCDistributedFileSystemDetails } from "jsr:@fathym/eac@0.2.106/dfs";
import { DFSFileHandler } from "jsr:@fathym/eac@0.2.106/dfs/handlers";
import { ComponentType, h, VNode } from "preact";
import {
  EaCRuntimeHandlerPipeline,
  EaCRuntimeHandlers,
} from "jsr:@fathym/eac@0.2.106/runtime/pipelines";

import {
  EaCMDXProcessor,
  EaCRuntimeHandler,
  EaCRuntimeHandlerSet,
  executePathMatch,
  isEaCMDXProcessor,
  loadDFSFileHandler,
  loadMiddleware,
  loadRequestPathPatterns,
  LoggingProvider,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";
import { compileMDX } from "../../utils/compileMDX.ts";
import { Logger } from "../modules/.deps.ts";
import { loadLayout } from "../../preact/loadLayout.ts";
import { ESBuild, PreactRenderToString } from "../../preact/.deps.ts";
import { PageProps } from "../../preact/PageProps.ts";
import { generateDocConfigFromSource } from "../../utils/generateDocConfigFromSource.ts";
import { convertHeadingsToNavItems } from "../../utils/convertHeadingsToNavItems.ts";
/**
 * Documentation site configuration for the EaCMDXProcessor.
 */
export type DocsConfig = {
  /** The title of the documentation site. */
  Title: string;

  /** Navigation structure for the documentation site. */
  Nav: DocsNavItem[];

  /** MDX Processing options (plugins, settings, etc.). */
  MDX: MDXConfig;
};

/**
 * Represents a single navigation item in the documentation.
 */
export type DocsNavItem = {
  /** .... */
  Abstract?: string;

  /** The title of the navigation link. */
  Title: string;

  /** The relative path for this navigation item. */
  Path?: string;

  /** Optional nested items for dropdown menus. */
  Children?: DocsNavItem[];
};

/**
 * MDX configuration options, including Remark/Rehype plugins.
 */
export type MDXConfig = {
  /** Plugins for Remark (Markdown transformation). */
  RemarkPlugins?: unknown[];

  /** Plugins for Rehype (HTML transformation). */
  RehypePlugins?: unknown[];

  /** Other MDX-related settings. */
  [key: string]: unknown;
};

export async function layoutLoader(
  logger: Logger,
  pathPattern: string,
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
  const layoutPaths = allPaths
    .filter((p) => p.endsWith("_layout.tsx"))
    .sort((a, b) => a.split("/").length - b.split("/").length);

  const layoutCalls = layoutPaths.map((p) => {
    return loadLayout(logger, appDFSHandler, p, appDFS, appDFSLookup);
  });

  const layouts = await Promise.all(layoutCalls);

  logger.debug(`Layouts - ${appDFSLookup}: `);
  layouts
    .map(
      (l) =>
        `${pathPattern.replace("*", "")}${
          l[0].startsWith(".") ? l[0].slice(1) : l[0]
        }`,
    )
    .forEach((pt) => logger.debug(`\t${pt}`));
  logger.debug("");

  return layouts;
}

export const EaCMDXProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    const logger = (await ioc.Resolve(LoggingProvider)).Package;

    if (!isEaCMDXProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCMDXProcessorHandlerResolver.",
      );
    }

    const processor = appProcCfg.Application.Processor as EaCMDXProcessor;

    try {
      const fileHandler = await loadDFSFileHandler(
        ioc,
        eac.DFSs!,
        eac.$GlobalOptions?.DFSs ?? {},
        processor.DFSLookup,
      );

      const dfs = eac.DFSs![processor.DFSLookup]!.Details!;

      const patterns = await loadRequestPathPatterns(
        fileHandler!,
        dfs,
        async (allPaths) => {
          const [docsConfig, middleware, layouts] = await Promise.all([
            (async () => {
              const configModule = await importDFSTypescriptModule(
                logger,
                fileHandler!,
                processor.ConfigPath ?? "./.config.ts",
                dfs,
                processor.DFSLookup,
                "ts",
              );
              return configModule?.module.default
                ? ((await configModule.module.default()) as DocsConfig)
                : undefined;
            })(),
            (async () => {
              const middlewarePaths = allPaths
                .filter((p) => p.endsWith("_middleware.ts"))
                .sort((a, b) => a.split("/").length - b.split("/").length);

              const middlewareCalls = middlewarePaths.map((p) => {
                return loadMiddleware(
                  logger,
                  fileHandler!,
                  p,
                  dfs,
                  processor.DFSLookup,
                );
              });

              return (await Promise.all(middlewareCalls))
                .filter((m) => m)
                .map((m) => m!);
            })(),
            (async () => {
              const layoutPaths = allPaths
                .filter((p) => p.endsWith("_layout.tsx"))
                .sort((a, b) => a.split("/").length - b.split("/").length);

              const layoutCalls = layoutPaths.map((p) =>
                layoutLoader(
                  logger,
                  appProcCfg.ResolverConfig.PathPattern,
                  allPaths,
                  dfs,
                  processor.DFSLookup,
                  fileHandler!,
                )
              );

              return (await Promise.all(layoutCalls))?.flatMap((l) => l);
            })(),
          ]);

          return { middleware, docsConfig, layouts };
        },
        async (filePath, { docsConfig, layouts }) => {
          const parentLayoutFilter = layouts.findLast(
            (l) => filePath.startsWith(l[0]) && l[5] !== undefined,
          )?.[5];

          const filteredLayouts = layouts.filter(
            ([root, _, __, ___, ____, parentLayouts]) => {
              if (parentLayoutFilter !== undefined) {
                return (
                  parentLayoutFilter.some((pl) => filePath.startsWith(pl)) ||
                  (parentLayouts === parentLayoutFilter &&
                    filePath.startsWith(root))
                );
              }

              return filePath.startsWith(root);
            },
          );

          const pageLayouts = filteredLayouts.map(([_root, layout]) => {
            return layout;
          });

          let pageLayoutHandlers:
            | EaCRuntimeHandlerSet[]
            | (EaCRuntimeHandler | EaCRuntimeHandlers)[] = filteredLayouts.map(
              ([_root, _layout, _isIsland, _contents, layoutHandler]) => {
                return layoutHandler;
              },
            );

          const file = await fileHandler!.GetFileInfo(
            filePath,
            Date.now().toString(),
          );

          const source = file?.Contents
            ? await toText(file.Contents)
            : "# File Not Found";

          const { content: mdxBody, data: frontmatter } = matter(source);

          const compModule = await compileMDX(
            ioc,
            mdxBody,
            docsConfig?.MDX ?? {},
          );

          const pipeline = new EaCRuntimeHandlerPipeline();

          if (compModule) {
            const renderStack: ComponentType<any>[] = [
              ...pageLayouts,
              compModule.compiled,
            ];

            if (pageLayoutHandlers && !Array.isArray(pageLayoutHandlers)) {
              pageLayoutHandlers = [
                pageLayoutHandlers as EaCRuntimeHandler | EaCRuntimeHandlers,
              ] as (EaCRuntimeHandler | EaCRuntimeHandlers)[];
            }

            pipeline.Append(
              ...(pageLayoutHandlers as (
                | EaCRuntimeHandler
                | EaCRuntimeHandlers
              )[]),
              compModule.handler,
            );

            pipeline.Append(async (req, ctx) => {
              const componentStack: ComponentType<any>[] = new Array(
                renderStack.length,
              ).fill(null);

              const headings = generateDocConfigFromSource(mdxBody);
              const docNavItems = convertHeadingsToNavItems(headings);

              const { prev: prevPage, next: nextPage } = getPrevNextItems(
                (docsConfig || { Nav: [] }) as DocsConfig,
                ctx.Runtime.URLMatch.Path || "",
              );

              const pageProps: PageProps = {
                Data: {
                  ...(ctx.Data || {}),
                  $Frontmatter: frontmatter || {},
                  $Config: docsConfig,
                  $DocNavItems: docNavItems,
                  $PrevPage: prevPage,
                  $NextPage: nextPage,
                },
                Params: ctx.Params,
                Revision: ctx.Runtime.Revision,
                Component: () => null,
              };

              for (let i = 0; i < renderStack.length; i++) {
                const fn = renderStack[i];
                if (!fn) continue;

                componentStack[i] = () => {
                  return h(fn, {
                    ...pageProps,
                    Component() {
                      return h(componentStack[i + 1], null);
                    },
                  });
                };
              }

              const routeComponent = componentStack[componentStack.length - 1];

              let finalComp = h(routeComponent, pageProps) as VNode;

              let i = componentStack.length - 1;

              while (i--) {
                const component = componentStack[i];

                const curComp = finalComp;

                finalComp = h(component, {
                  ...pageProps,
                  Component() {
                    return curComp;
                  },
                } as any) as VNode;

                const bodyHtml = await PreactRenderToString.renderToStringAsync(
                  finalComp,
                );

                return new Response(bodyHtml, {
                  headers: { "Content-Type": "text/html" },
                });
              }

              return new Response("Failed to load document", {
                headers: { "Content-Type": "text/javascript" },
              });
            });
          }

          return (req, ctx) => {
            return pipeline.Execute(req, ctx);
          };
        },
        (filePath, pipeline, { middleware }) => {
          const reqMiddleware = middleware
            .filter(([root]) => filePath.startsWith(root))
            .flatMap(([_root, handler]) =>
              Array.isArray(handler) ? handler : [handler]
            );
          pipeline.Prepend(...reqMiddleware);
        },
        appProcCfg.Revision,
      ).then((patterns) => {
        if (patterns?.length) {
          logger.debug(`MDX Routes - ${processor.DFSLookup}: `);
          patterns
            .map((p) => p.PatternText)
            .map(
              (pt) =>
                `${appProcCfg.ResolverConfig.PathPattern.replace("*", "")}${
                  pt.endsWith("/") ? pt.substring(0, pt.length - 1) : pt
                }`,
            )
            .forEach((pt) => logger.debug(`\t${pt}`));
          logger.debug("");
        }

        return patterns;
      });

      return (req, ctx) => {
        return executePathMatch(patterns, req, ctx);
      };
    } catch (err) {
      if (err instanceof Error) {
        logger.error(
          `Error processing ${appProcCfg.ApplicationLookup} MDX processor: ${err.message}`,
        );
      }

      throw err;
    }
  },
};

function flattenNav(items: DocsNavItem[]): DocsNavItem[] {
  return items.flatMap((item) => [
    item,
    ...(item.Children ? flattenNav(item.Children) : []),
  ]);
}

function getPrevNextItems(
  docsConfig: DocsConfig,
  currentPath: string,
): {
  prev?: DocsNavItem;
  next?: DocsNavItem;
} {
  const flat = flattenNav(docsConfig.Nav); // ✅ Use docsConfig.Nav here
  const index = flat.findIndex((item) => item.Path === currentPath);

  return {
    prev: index > 0 ? flat[index - 1] : undefined,
    next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : undefined,
  };
}
