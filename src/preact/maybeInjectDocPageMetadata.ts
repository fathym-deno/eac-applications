import { Logger } from "jsr:@std/log@0.224.14/logger";
import { toText } from "jsr:@std/streams@^1.0.9/to-text";
import { EaCPreactAppProcessor } from "../applications/processors/EaCPreactAppProcessor.ts";
import { injectDocPageMetadata } from "../utils/injectDocPageMetadata.ts";
import {
  DFSFileHandler,
  EaCDistributedFileSystemDetails,
  EaCRuntimeContext,
  importDFSTypescriptModule,
} from "./.deps.ts";

export async function maybeInjectDocPageMetadata(
  logger: Logger,
  processor: EaCPreactAppProcessor,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
  ctx: EaCRuntimeContext,
): Promise<void> {
  let configPath = processor?.DocPageConfigPath;

  if (typeof configPath === "string") {
    const configModule = await importDFSTypescriptModule(
      logger,
      fileHandler,
      configPath || "./.config.ts",
      dfs,
      dfsLookup,
      "ts",
    );

    const docsConfig = configModule?.module.default
      ? await configModule.module.default()
      : undefined;

    const file = await fileHandler.GetFileInfo(filePath, Date.now().toString());
    const source = file?.Contents ? await toText(file.Contents) : "";

    if (docsConfig && source) {
      const values = injectDocPageMetadata(source, docsConfig, ctx);

      ctx.Data = {
        ...(ctx.Data || {}),
        ...values,
      };
    }
  }
}
