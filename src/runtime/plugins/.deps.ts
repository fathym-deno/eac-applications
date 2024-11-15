export * as colors from "jsr:@std/fmt@1.0.3/colors";

export { initializeDenoKv } from "jsr:@fathym/common@0.2.167/deno-kv";
export { loadJwtConfig } from "jsr:@fathym/common@0.2.167/jwt";

export type { EverythingAsCode } from "jsr:@fathym/eac@0.2.8";
export type { EaCRuntimeConfig } from "jsr:@fathym/eac@0.2.8/runtime/config";
export type {
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
} from "jsr:@fathym/eac@0.2.8/runtime/plugins";

export {
  type EaCDenoKVDetails,
  type EverythingAsCodeDenoKV,
  isEaCDenoKVDetails,
  isEverythingAsCodeDenoKV,
} from "jsr:@fathym/eac-deno-kv@0.0.2";

export {
  DefaultDFSFileHandlerResolver,
  EaCDenoKVDistributedFileSystemHandlerResolver,
  EaCESMDistributedFileSystemHandlerResolver,
  EaCJSRDistributedFileSystemHandlerResolver,
  EaCLocalDistributedFileSystemHandlerResolver,
  EaCNPMDistributedFileSystemHandlerResolver,
  EaCRemoteDistributedFileSystemHandlerResolver,
  EaCWorkerDistributedFileSystemHandlerResolver,
  UnknownEaCDistributedFileSystemHandlerResolver,
} from "jsr:@fathym/eac-dfs@0.0.8/resolvers";

export { IoCContainer } from "jsr:@fathym/ioc@0.0.12";

export * as djwt from "jsr:@zaubrik/djwt@3.0.2";

export type { EverythingAsCodeApplications } from "../../applications/.exports.ts";
export type { EaCResponseProcessor } from "../../applications/processors/.exports.ts";

export {
  DefaultModifierMiddlewareResolver,
  EaCBaseHREFModifierHandlerResolver,
  EaCDenoKVCacheModifierHandlerResolver,
  EaCJWTValidationModifierHandlerResolver,
  EaCKeepAliveModifierHandlerResolver,
  EaCMarkdownToHTMLModifierHandlerResolver,
  EaCOAuthModifierHandlerResolver,
  EaCStripeModifierHandlerResolver,
  EaCTracingModifierHandlerResolver,
} from "../modifiers/.exports.ts";

export {
  DefaultProcessorHandlerResolver,
  EaCAPIProcessorHandlerResolver,
  EaCDFSProcessorHandlerResolver,
  EaCOAuthProcessorHandlerResolver,
  EaCPreactAppProcessorHandlerResolver,
  EaCProxyProcessorHandlerResolver,
  EaCRedirectProcessorHandlerResolver,
  EaCResponseProcessorHandlerResolver,
  EaCStripeProcessorHandlerResolver,
  EaCTailwindProcessorHandlerResolver,
  UnknownEaCProcessorHandlerResolver,
} from "../processors/.exports.ts";
