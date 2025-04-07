export { parse as parseJsonc } from "jsr:@std/jsonc@1.0.0";
export type { Logger } from "jsr:@std/log@0.224.14";
export * as path from "jsr:@std/path@1.0.8";

export { jsonMapSetClone } from "jsr:@fathym/common@0.2.184/iterables/json-map-set";
export { LoggingProvider } from "jsr:@fathym/common@0.2.184/log";
export {
  type DenoConfig,
  loadDenoConfigSync,
} from "jsr:@fathym/common@0.2.184/build";
export { merge } from "jsr:@fathym/common@0.2.184/merge";

export {
  denoPlugins,
  type ESBuild,
  type ESBuildContext,
  type ESBuildLoader,
  type ESBuildOnLoadArgs,
  type ESBuildOnLoadResult,
  type ESBuildOnResolveArgs,
  type ESBuildOnResolveResult,
  type ESBuildOptions,
  type ESBuildPlugin,
  type ESBuildPluginBuild,
  type ESBuildResult,
} from "jsr:@fathym/eac@0.2.106/esbuild";
export type { EaCRuntimeContext } from "jsr:@fathym/eac@0.2.106/runtime";
export {
  EAC_RUNTIME_DEV,
  IS_DENO_DEPLOY,
} from "jsr:@fathym/eac@0.2.106/runtime/config";
export {
  type EaCRuntimeHandler,
  EaCRuntimeHandlerPipeline,
  type EaCRuntimeHandlers,
  type EaCRuntimeHandlerSet,
  // } from "../../../eac/src/runtime/pipelines/.exports.ts";
} from "jsr:@fathym/eac@0.2.106/runtime/pipelines";

export type {
  DistributedFileSystemOptions,
  EaCDistributedFileSystemAsCode,
  EaCDistributedFileSystemDetails,
  EverythingAsCodeDFS,
} from "jsr:@fathym/eac@0.2.106/dfs";
export type { DFSFileHandler } from "jsr:@fathym/eac@0.2.106/dfs/handlers";
export {
  executePathMatch,
  importDFSTypescriptModule,
  loadDFSFileHandler,
  loadMiddleware,
  loadRequestPathPatterns,
  type PathMatch,
} from "jsr:@fathym/eac@0.2.106/dfs/utils";

export { IoCContainer } from "jsr:@fathym/ioc@0.0.14";

export {
  type Attributes,
  Component,
  type ComponentChildren,
  type ComponentType,
  Fragment,
  h,
  isValidElement,
  type JSX,
  type Options as PreactOptions,
  options as preactOptions,
  type RenderableProps,
  type VNode,
} from "npm:preact@10.20.1";

export * as PreactRenderToString from "npm:preact-render-to-string@6.5.9";

export type { EaCPreactAppProcessor } from "../applications/processors/.exports.ts";
