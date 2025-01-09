import { EaCPreactAppProcessor, isEaCPreactAppProcessor } from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";
import { establishPreactAppHandler } from "../../preact/establishPreactAppHandler.ts";

export const EaCPreactAppProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCPreactAppProcessorHandlerResolver.",
      );
    }

    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    return establishPreactAppHandler(ioc, processor, eac);
  },
};
