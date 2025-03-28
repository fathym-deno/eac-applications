export * as DenoKVOAuth from "jsr:@deno/kv-oauth@0.11.0";

export { STATUS_CODE } from "jsr:@std/http@1.0.13";
export { toText } from "jsr:@std/streams@1.0.9";

export { proxyRequest, redirectRequest } from "jsr:@fathym/common@0.2.179/http";
export { djwt } from "jsr:@fathym/common@0.2.179/jwt";
export { LoggingProvider } from "jsr:@fathym/common@0.2.179/log";
export {
  oAuthRequest,
  type UserOAuthConnection,
} from "jsr:@fathym/common@0.2.179/oauth";

export type { EverythingAsCode } from "jsr:@fathym/eac@0.2.104";
export type { EaCRuntimeContext } from "jsr:@fathym/eac@0.2.104/runtime";
export { EAC_RUNTIME_DEV } from "jsr:@fathym/eac@0.2.104/runtime/config";
export type { ESBuild } from "jsr:@fathym/eac@0.2.104/esbuild";
export type {
  EaCRuntimeHandler,
  EaCRuntimeHandlerSet,
} from "jsr:@fathym/eac@0.2.104/runtime/pipelines";

export {
  executePathMatch,
  loadDFSFileHandler,
  loadEaCRuntimeHandlers,
  loadMiddleware,
  loadRequestPathPatterns,
} from "jsr:@fathym/eac@0.2.104/dfs/utils";

export {
  type EaCGitHubAppProviderDetails,
  type EaCProviderAsCode,
  type EverythingAsCodeIdentity,
  isEaCAzureADB2CProviderDetails,
  isEaCAzureADProviderDetails,
  isEaCGitHubAppProviderDetails,
  isEaCOAuthProviderDetails,
} from "jsr:@fathym/eac-identity@0.0.13";

export { IoCContainer } from "jsr:@fathym/ioc@0.0.14";

import Mime from "npm:mime@4.0.6";
export const mime = Mime;

export {
  connect,
  type JetStreamManager,
  type NatsConnection,
  StringCodec,
} from "npm:nats@2.29.2";

export type { EverythingAsCodeApplications } from "../../applications/.exports.ts";
export {
  type EaCNATSProcessor,
  isEaCNATSProcessor,
} from "../../applications/processors/.exports.ts";

export {
  type EaCAPIProcessor,
  type EaCApplicationProcessorConfig,
  type EaCDenoLSPProcessor,
  type EaCDFSProcessor,
  type EaCMDXProcessor,
  type EaCOAuthProcessor,
  type EaCPreactAppProcessor,
  type EaCProxyProcessor,
  type EaCRedirectProcessor,
  type EaCResponseProcessor,
  type EaCStripeProcessor,
  type EaCTailwindProcessor,
  isEaCAPIProcessor,
  isEaCDenoLSPProcessor,
  isEaCDFSProcessor,
  isEaCMDXProcessor,
  isEaCOAuthProcessor,
  isEaCPreactAppProcessor,
  isEaCProxyProcessor,
  isEaCRedirectProcessor,
  isEaCResponseProcessor,
  isEaCStripeProcessor,
  isEaCTailwindProcessor,
} from "../../applications/processors/.exports.ts";

// export { loadOctokit } from "../../utils/.exports.ts";

export {
  establishTailwindHandlers,
  loadOAuth2ClientConfig,
} from "../modules/.exports.ts";
