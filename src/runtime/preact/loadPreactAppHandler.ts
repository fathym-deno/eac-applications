// deno-lint-ignore-file no-explicit-any
import {
  ComponentType,
  DFSFileHandler,
  EaCDistributedFileSystemDetails,
  EaCRuntimeHandler,
  EaCRuntimeHandlerPipeline,
  EaCRuntimeHandlers,
  EaCRuntimeHandlerSet,
  ESBuild,
  Logger,
  merge,
} from "./.deps.ts";
import { PreactRenderHandler } from "./PreactRenderHandler.ts";
import { loadPreactAppPageHandler } from "./loadPreactAppPageHandler.ts";

export async function loadPreactAppHandler(
  logger: Logger,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
  layouts: [
    string,
    ComponentType<any>,
    boolean,
    string,
    EaCRuntimeHandlerSet,
    string[] | undefined,
  ][],
  renderHandler: PreactRenderHandler,
): Promise<EaCRuntimeHandlerSet> {
  let [pageHandlers, component, isIsland, contents] =
    await loadPreactAppPageHandler(
      logger,
      fileHandler,
      filePath,
      dfs,
      dfsLookup,
    );

  if (isIsland) {
    renderHandler.AddIsland(component, filePath, contents);
  }

  const parentLayoutFilter = layouts.findLast(
    (l) => filePath.startsWith(l[0]) && l[5] !== undefined,
  )?.[5];

  const filteredLayouts = layouts.filter(
    ([root, _, __, ___, ____, parentLayouts]) => {
      if (parentLayoutFilter !== undefined) {
        return (
          parentLayoutFilter.some((pl) => filePath.startsWith(pl)) ||
          (parentLayouts === parentLayoutFilter && filePath.startsWith(root))
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

  const renderStack: ComponentType<any>[] = [...pageLayouts, component];

  const renderSetupHandler: EaCRuntimeHandler = (_req, ctx) => {
    ctx.Render = async (data = {}) => {
      ctx.Data = merge(ctx.Data || {}, data ?? {});

      const html = await renderHandler.RenderPage(renderStack, ctx);

      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    };

    return ctx.Next();
  };

  if (!Array.isArray(pageHandlers)) {
    pageHandlers = [pageHandlers];
  }

  const pipeline = new EaCRuntimeHandlerPipeline();

  pipeline.Append(renderSetupHandler);

  if (pageLayoutHandlers && !Array.isArray(pageLayoutHandlers)) {
    pageLayoutHandlers = [
      pageLayoutHandlers as EaCRuntimeHandler | EaCRuntimeHandlers,
    ] as (EaCRuntimeHandler | EaCRuntimeHandlers)[];
  }

  pipeline.Append(
    ...(pageLayoutHandlers as (EaCRuntimeHandler | EaCRuntimeHandlers)[]),
  );

  pipeline.Append(...pageHandlers);

  return (req, ctx) => {
    return pipeline.Execute(req, ctx);
  };
}

export function markIslands(root: ComponentType<any>): ComponentType<any> {
  return root;
}
