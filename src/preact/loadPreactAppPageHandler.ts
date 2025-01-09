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

export async function loadPreactAppPageHandler(
  logger: Logger,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
): Promise<
  [EaCRuntimeHandlerSet, ComponentType<any>, boolean, string, string[]]
> {
  const loader = filePath.endsWith(".ts") ? "ts" : "tsx";

  const { module, contents } = (await importDFSTypescriptModule(
    logger,
    fileHandler,
    filePath,
    dfs,
    dfsLookup,
    loader,
  ))!;

  const component: ComponentType<any> | undefined = module.default;

  const isIsland = "IsIsland" in module ? module.IsIsland : false;

  let handler: EaCRuntimeHandlerSet | undefined = module.handler;

  if (!component && !handler) {
    throw new Deno.errors.NotFound(
      `The page '${filePath}' does not have a component to render or handler for processing.`,
    );
  }

  if (!handler) {
    handler = (_req, ctx) => {
      return ctx.Render({});
    };
  }

  return [handler, component!, isIsland, contents, module.ParentLayouts || []];
}
