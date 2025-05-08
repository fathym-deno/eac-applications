// deno-lint-ignore-file no-explicit-any
import {
  ComponentType,
  DFSFileHandler,
  EaCDistributedFileSystemDetails,
  EaCRuntimeHandlerSet,
  importDFSTypescriptModule,
  IoCContainer,
  Logger,
  matter,
  toText,
} from "./.deps.ts";
import { createVirtualMDX } from "../utils/compileMDX.ts";

export async function loadPreactAppPageHandler(
  logger: Logger,
  ioc: IoCContainer,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
): Promise<
  [EaCRuntimeHandlerSet, ComponentType<any>, boolean, string, string[]]
> {
  const isMDX = filePath.endsWith(".mdx") || filePath.endsWith(".md");

  let loader = filePath.endsWith(".ts") ? "ts" : "tsx";

  if (isMDX) {
    const file = await fileHandler.GetFileInfo(filePath, Date.now().toString());

    const source = await toText(file!.Contents);

    const { content: mdxBody, data: frontmatter } = matter(source);

    const isIsland = frontmatter?.IsIsland === true;

    const mdxResult = await createVirtualMDX(
      ioc,
      dfsLookup,
      mdxBody,
      filePath,
      isIsland,
    );

    fileHandler = mdxResult.FileHandler;

    loader = "tsx";
  }

  const { module, contents } = (await importDFSTypescriptModule(
    logger,
    fileHandler,
    filePath,
    dfs,
    dfsLookup,
    loader as "ts" | "tsx",
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
