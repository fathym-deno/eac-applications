import {
  EaCApplicationProcessorConfig,
  EaCRuntimeHandler,
  EverythingAsCode,
  IoCContainer,
  isEaCAPIProcessor,
  isEaCDFSProcessor,
  isEaCOAuthProcessor,
  isEaCPreactAppProcessor,
  isEaCProxyProcessor,
  isEaCRedirectProcessor,
  isEaCResponseProcessor,
  isEaCStripeProcessor,
  isEaCTailwindProcessor,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

export class DefaultProcessorHandlerResolver
  implements ProcessorHandlerResolver {
  public async Resolve(
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: EverythingAsCode,
  ): Promise<EaCRuntimeHandler | undefined> {
    let toResolveName: string = "";

    if (isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCRedirectProcessor";
    } else if (isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCPreactAppProcessor";
    } else if (isEaCProxyProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCProxyProcessor";
    } else if (isEaCOAuthProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCOAuthProcessor";
    } else if (isEaCAPIProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCAPIProcessor";
    } else if (isEaCDFSProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCDFSProcessor";
    } else if (isEaCResponseProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCResponseProcessor";
    } else if (isEaCStripeProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCStripeProcessor";
    } else if (isEaCTailwindProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCTailwindProcessor";
    } else {
      toResolveName = "UnknownEaCProcessor";
    }

    const resolver = await ioc.Resolve<ProcessorHandlerResolver>(
      ioc.Symbol("ProcessorHandlerResolver"),
      toResolveName,
    );

    return await resolver.Resolve(ioc, appProcCfg, eac);
  }
}