import type { EaCRuntimeContext } from "jsr:@fathym/eac@0.2.131/runtime";
import {
  MCPAuthHook,
  MCPEventDefinition,
  MCPEventHandler,
  MCPEventSubscription,
  MCPHandshakeHook,
  MCPHandshakeMetadata,
  MCPHookSet,
  MCPPromptDefinition,
  MCPPromptDefinitionEntry,
  MCPPromptHandler,
  MCPResourceDefinition,
  MCPResourceHandler,
  MCPResourceRequest,
  MCPResourceResponse,
  MCPToolDefinition,
  MCPToolHandler,
  MCPToolInvocation,
  MCPToolResult,
  ModelContextProtocolSnapshot,
} from "./ModelContextProtocolTypes.ts";

export class ModelContextToolRegistry {
  #definitions = new Map<string, MCPToolDefinition>();

  public Register<TParams = unknown, TResult = unknown>(
    definition: MCPToolDefinition<TParams, TResult>,
  ): void {
    this.#definitions.set(definition.Id, definition as MCPToolDefinition);
  }

  public Get(id: string): MCPToolDefinition | undefined {
    return this.#definitions.get(id);
  }

  public Entries(): MCPToolDefinition[] {
    return [...this.#definitions.values()];
  }
}

export class ModelContextResourceRegistry {
  #definitions = new Map<string, MCPResourceDefinition>();

  public Register<TQuery = Record<string, unknown>, TResult = unknown>(
    definition: MCPResourceDefinition<TQuery, TResult>,
  ): void {
    this.#definitions.set(definition.Id, definition as MCPResourceDefinition);
  }

  public Get(id: string): MCPResourceDefinition | undefined {
    return this.#definitions.get(id);
  }

  public Entries(): MCPResourceDefinition[] {
    return [...this.#definitions.values()];
  }
}

export class ModelContextEventRegistry {
  #definitions = new Map<string, MCPEventDefinition>();

  public Register<TCursor = string, TPayload = unknown>(
    definition: MCPEventDefinition<TCursor, TPayload>,
  ): void {
    this.#definitions.set(definition.Id, definition as MCPEventDefinition);
  }

  public Get(id: string): MCPEventDefinition | undefined {
    return this.#definitions.get(id);
  }

  public Entries(): MCPEventDefinition[] {
    return [...this.#definitions.values()];
  }
}

export class ModelContextPromptRegistry {
  #definitions = new Map<string, MCPPromptDefinitionEntry>();

  public Register<TTemplate = string>(
    definition: MCPPromptDefinitionEntry<TTemplate>,
  ): void {
    this.#definitions.set(
      definition.Id,
      definition as MCPPromptDefinitionEntry,
    );
  }

  public Get(id: string): MCPPromptDefinitionEntry | undefined {
    return this.#definitions.get(id);
  }

  public Entries(): MCPPromptDefinitionEntry[] {
    return [...this.#definitions.values()];
  }
}

export class ModelContextProtocolRuntime {
  #handshake?: MCPHandshakeMetadata;
  #hooks: MCPHookSet = {};

  public readonly Tools = new ModelContextToolRegistry();
  public readonly Resources = new ModelContextResourceRegistry();
  public readonly Events = new ModelContextEventRegistry();
  public readonly Prompts = new ModelContextPromptRegistry();

  public SetHandshake(metadata: MCPHandshakeMetadata): void {
    this.#handshake = metadata;
  }

  public GetHandshake(): MCPHandshakeMetadata | undefined {
    return this.#handshake;
  }

  public OnAuth(hook: MCPAuthHook): void {
    this.#hooks.Auth = hook;
  }

  public OnError(
    hook: (error: unknown, ctx: EaCRuntimeContext) => Promise<Response | void>,
  ): void {
    this.#hooks.Error = hook;
  }

  public OnHandshake(hook: MCPHandshakeHook): void {
    this.#hooks.Handshake = hook;
  }

  public Hooks(): MCPHookSet {
    return { ...this.#hooks };
  }

  public Snapshot(): ModelContextProtocolSnapshot {
    return {
      Handshake: this.#handshake,
      Hooks: { ...this.#hooks },
      Tools: this.Tools.Entries(),
      Resources: this.Resources.Entries(),
      Events: this.Events.Entries(),
      Prompts: this.Prompts.Entries(),
    };
  }
}

export type ExecuteToolOptions = {
  Invocation: MCPToolInvocation;
  Context: EaCRuntimeContext;
};

export async function executeTool<TResult = unknown>(
  runtime: ModelContextProtocolRuntime,
  { Invocation, Context }: ExecuteToolOptions,
): Promise<MCPToolResult<TResult> | Response | void> {
  const definition = runtime.Tools.Get(Invocation.Tool);

  if (!definition) {
    throw new Error(`Tool '${Invocation.Tool}' is not registered.`);
  }

  const handler = definition.Handler as MCPToolHandler<unknown, TResult>;

  return await handler(Invocation, Context);
}

export async function resolveResource<TResult = unknown>(
  runtime: ModelContextProtocolRuntime,
  request: MCPResourceRequest,
  ctx: EaCRuntimeContext,
): Promise<MCPResourceResponse<TResult> | Response> {
  const definition = runtime.Resources.Get(request.Resource);

  if (!definition) {
    throw new Error(`Resource '${request.Resource}' is not registered.`);
  }

  const handler = definition.Handler as MCPResourceHandler<
    Record<string, unknown>,
    TResult
  >;

  return await handler(request, ctx);
}

export async function subscribeToEvent(
  runtime: ModelContextProtocolRuntime,
  subscription: MCPEventSubscription,
  ctx: EaCRuntimeContext,
): Promise<AsyncIterable<unknown>> {
  const definition = runtime.Events.Get(subscription.Event);

  if (!definition) {
    throw new Error(`Event '${subscription.Event}' is not registered.`);
  }

  const handler = definition.Handler as MCPEventHandler;

  const iterable = await handler(subscription, ctx);

  return iterable;
}

export async function renderPrompt<TTemplate = string>(
  runtime: ModelContextProtocolRuntime,
  id: string,
  ctx: EaCRuntimeContext,
): Promise<MCPPromptDefinition<TTemplate>> {
  const entry = runtime.Prompts.Get(id);

  if (!entry) {
    throw new Error(`Prompt '${id}' is not registered.`);
  }

  const result = await entry.Handler(ctx);

  return result as MCPPromptDefinition<TTemplate>;
}
