export * as DenoKVOAuth from "jsr:@deno/kv-oauth@0.11.0";
export type { Logger } from "jsr:@std/log@0.224.14/get-logger";

export { STATUS_CODE } from "jsr:@std/http@1.0.13";
export { toText } from "jsr:@std/streams@1.0.9";

export { buildURLMatch } from "jsr:@fathym/common@0.2.265/http";
export { proxyRequest, redirectRequest } from "jsr:@fathym/common@0.2.265/http";
export { djwt } from "jsr:@fathym/common@0.2.265/jwt";
export { LoggingProvider } from "jsr:@fathym/common@0.2.265/log";
export {
  oAuthRequest,
  type UserOAuthConnection,
} from "jsr:@fathym/common@0.2.265/oauth";

export type { EverythingAsCode } from "jsr:@fathym/eac@0.2.113";
export type { EverythingAsCodeDFS } from "jsr:@fathym/eac@0.2.113/dfs";
export { DFSFileHandler } from "jsr:@fathym/eac@0.2.113/dfs/handlers";
export type { PathMatch } from "jsr:@fathym/eac@0.2.113/dfs/utils";
export type { EaCRuntimeContext } from "jsr:@fathym/eac@0.2.113/runtime";
export { EAC_RUNTIME_DEV } from "jsr:@fathym/eac@0.2.113/runtime/config";
export type { ESBuild } from "jsr:@fathym/eac@0.2.113/esbuild";
export type {
  EaCRuntimeHandler,
  EaCRuntimeHandlerSet,
} from "jsr:@fathym/eac@0.2.113/runtime/pipelines";

export {
  executePathMatch,
  loadDFSFileHandler,
  loadEaCRuntimeHandlers,
  loadMiddleware,
  loadRequestPathPatterns,
} from "jsr:@fathym/eac@0.2.113/dfs/utils";

export {
  type EaCGitHubAppProviderDetails,
  type EaCProviderAsCode,
  type EverythingAsCodeIdentity,
  isEaCAzureADB2CProviderDetails,
  isEaCAzureADProviderDetails,
  isEaCGitHubAppProviderDetails,
  isEaCOAuthProviderDetails,
} from "jsr:@fathym/eac-identity@0.0.17";

export { IoCContainer } from "jsr:@fathym/ioc@0.0.14";

import Mime from "npm:mime@4.0.6";
export const mime = Mime;

export { EventHubConsumerClient } from "npm:@azure/event-hubs@6.0.0";

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
  type BaseEaCMessagingProcessor,
  type EaCAPIProcessor,
  type EaCApplicationProcessorConfig,
  type EaCAzureEventHubProcessor,
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
  isEaCAzureEventHubProcessor,
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
