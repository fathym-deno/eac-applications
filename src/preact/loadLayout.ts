// deno-lint-ignore-file no-explicit-any
import {
  ComponentType,
  DFSFileHandler,
  EaCDistributedFileSystemDetails,
  EaCRuntimeHandlerSet,
  ESBuild,
  importDFSTypescriptModule,
  Logger,
} from "./.deps.ts";

export async function loadLayout(
  logger: Logger,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
): Promise<
  [
    string,
    ComponentType<any>,
    boolean,
    string,
    EaCRuntimeHandlerSet,
    string[] | undefined,
  ]
> {
  const { module: layoutModule, contents } = (await importDFSTypescriptModule(
    logger,
    fileHandler,
    filePath,
    dfs,
    dfsLookup,
    "tsx",
  ))!;

  const layout: ComponentType<any> | undefined = layoutModule.default;

  const root = filePath.replace("_layout.tsx", "");

  if (!layout) {
    throw new Deno.errors.NotFound(
      `The layout does not have ${root} does not have a componenet to render.`,
    );
  }

  let handler: EaCRuntimeHandlerSet | undefined = layoutModule.handler;

  if (!handler) {
    handler = (_req, ctx) => {
      return ctx.Next();
    };
  }

  const isIsland = "IsIsland" in layoutModule ? layoutModule.IsIsland : false;

  const parentLayouts: string[] | undefined = "ParentLayouts" in layoutModule
    ? layoutModule.ParentLayouts
    : undefined;

  return [root, layout, isIsland, contents, handler, parentLayouts];
}
