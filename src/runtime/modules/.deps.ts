export { transpile } from "jsr:@deno/emit@0.46.0";

export * as DenoKVOAuth from "jsr:@deno/kv-oauth@0.11.0";

export { STATUS_CODE } from "jsr:@std/http@1.0.13";

export type { Logger } from "jsr:@std/log@0.224.14";

export * as path from "jsr:@std/path@1.0.8";

export { redirectRequest } from "jsr:@fathym/common@0.2.261/http";
export type { JWTConfig } from "jsr:@fathym/common@0.2.261/jwt";
export {
  creatAzureADB2COAuthConfig,
  createAzureADOAuthConfig,
  createGitHubOAuthConfig,
  createOAuthHelpers,
  creatOAuthConfig,
  type UserOAuthConnection,
  userOAuthConnExpired,
} from "jsr:@fathym/common@0.2.261/oauth";

export type { EverythingAsCode } from "jsr:@fathym/eac@0.2.111";

export { type EaCRuntimeContext } from "jsr:@fathym/eac@0.2.111/runtime";

export { EAC_RUNTIME_DEV } from "jsr:@fathym/eac@0.2.111/runtime/config";

export { type EaCRuntimeHandler } from "jsr:@fathym/eac@0.2.111/runtime/pipelines";

export {
  denoKvCacheReadableStream,
  DenoKVFileStream,
  denoKvReadReadableStreamCache,
} from "jsr:@fathym/eac@0.2.111/dfs/utils";

export {
  type EaCProviderAsCode,
  type EverythingAsCodeIdentity,
  isEaCAzureADB2CProviderDetails,
  isEaCAzureADProviderDetails,
  isEaCGitHubAppProviderDetails,
  isEaCOAuthProviderDetails,
} from "jsr:@fathym/eac-identity@0.0.14";

export {
  DOMParser,
  Element,
  initParser,
} from "jsr:@b-fuze/deno-dom@0.1.49/wasm-noinit";

import TailwindCSS from "npm:tailwindcss@3.4.1";
export const tailwindCss = TailwindCSS;
export { type Config as TailwindConfig } from "npm:tailwindcss@3.4.1";

import postcss from "npm:postcss@8.4.35";
export { postcss };

import cssnano from "npm:cssnano@6.0.3";
export { cssnano };

import autoprefixer from "npm:autoprefixer@10.4.17";
export { autoprefixer };

export type { EaCTailwindProcessor } from "../../applications/processors/.exports.ts";

export { type EaCApplicationsRuntimeContext } from "../_/.exports.ts";
