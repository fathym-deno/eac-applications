import type { EaCRuntimeContext } from "jsr:@fathym/eac@0.2.131/runtime";

/**
 * Metadata surfaced during the MCP handshake.
 */
export type MCPHandshakeMetadata = {
  Id: string;
  Name?: string;
  Version: string;
  Description?: string;
  Provider?: string;
  Capabilities?: Record<string, unknown>;
};

/**
 * Invocation payload passed to tool handlers.
 */
export type MCPToolInvocation<TParams = unknown> = {
  Tool: string;
  Params: TParams;
};

export type MCPToolResult<TResult = unknown> = TResult;

export type MCPToolHandler<TParams = unknown, TResult = unknown> = (
  invocation: MCPToolInvocation<TParams>,
  ctx: EaCRuntimeContext,
) => Promise<MCPToolResult<TResult> | Response | void>;

export type MCPToolDefinition<TParams = unknown, TResult = unknown> = {
  Id: string;
  Title?: string;
  Description?: string;
  InputSchema?: unknown;
  ResultSchema?: unknown;
  Handler: MCPToolHandler<TParams, TResult>;
};

export type MCPResourceRequest<TQuery = Record<string, unknown>> = {
  Resource: string;
  Query?: TQuery;
  ETag?: string;
};

export type MCPResourceResponse<TResult = unknown> = {
  Resource: string;
  Data: TResult;
  ContentType?: string;
  ETag?: string;
  Modified?: string;
};

export type MCPResourceHandler<
  TQuery = Record<string, unknown>,
  TResult = unknown,
> = (
  request: MCPResourceRequest<TQuery>,
  ctx: EaCRuntimeContext,
) => Promise<MCPResourceResponse<TResult> | Response>;

export type MCPResourceDefinition<
  TQuery = Record<string, unknown>,
  TResult = unknown,
> = {
  Id: string;
  Title?: string;
  Description?: string;
  Schema?: unknown;
  Handler: MCPResourceHandler<TQuery, TResult>;
};

export type MCPEventSubscription<TCursor = string> = {
  Event: string;
  Cursor?: TCursor;
};

export type MCPEventMessage<TPayload = unknown> = {
  Event: string;
  Cursor?: string;
  Payload: TPayload;
};

export type MCPEventHandler<TCursor = string, TPayload = unknown> = (
  subscription: MCPEventSubscription<TCursor>,
  ctx: EaCRuntimeContext,
) =>
  | AsyncIterable<MCPEventMessage<TPayload>>
  | Promise<
    AsyncIterable<MCPEventMessage<TPayload>>
  >;

export type MCPEventDefinition<
  TCursor = string,
  TPayload = unknown,
> = {
  Id: string;
  Title?: string;
  Description?: string;
  Handler: MCPEventHandler<TCursor, TPayload>;
};

export type MCPPromptContext = EaCRuntimeContext;

export type MCPPromptDefinition<TTemplate = string> = {
  Id: string;
  Title?: string;
  Description?: string;
  Template: TTemplate;
  Metadata?: Record<string, unknown>;
};

export type MCPPromptHandler<TTemplate = string> = (
  ctx: MCPPromptContext,
) => Promise<MCPPromptDefinition<TTemplate>>;

export type MCPPromptDefinitionEntry<TTemplate = string> = {
  Id: string;
  Title?: string;
  Description?: string;
  Metadata?: Record<string, unknown>;
  Handler: MCPPromptHandler<TTemplate>;
};

export type MCPAuthHook = (
  token: string | undefined,
  ctx: EaCRuntimeContext,
) => Promise<unknown>;

export type MCPErrorHook = (
  error: unknown,
  ctx: EaCRuntimeContext,
) => Promise<Response | void>;

export type MCPHandshakeHook = (
  ctx: EaCRuntimeContext,
) => Promise<MCPHandshakeMetadata | void>;

export type MCPHookSet = {
  Auth?: MCPAuthHook;
  Error?: MCPErrorHook;
  Handshake?: MCPHandshakeHook;
};

export type ModelContextProtocolSnapshot = {
  Handshake?: MCPHandshakeMetadata;
  Hooks: MCPHookSet;
  Tools: MCPToolDefinition[];
  Resources: MCPResourceDefinition[];
  Events: MCPEventDefinition[];
  Prompts: MCPPromptDefinitionEntry[];
};
