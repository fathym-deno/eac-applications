import {
  EaCRuntimeHandler,
  EaCRuntimeHandlerPipeline,
  EaCRuntimeHandlerRouteGroup,
} from "./.deps.ts";

export class RuntimeHost {
  protected routes: EaCRuntimeHandlerRouteGroup[] = [];

  protected revision?: string;

  public GetRevision(): string | undefined {
    return this.revision;
  }

  public SetRoutes(
    routes: EaCRuntimeHandlerRouteGroup[],
    revision?: string,
  ): void {
    this.routes = routes || [];
    this.revision = revision;
  }

  public GetStatus(): { revision?: string; routeGroups: number } {
    return { revision: this.revision, routeGroups: this.routes.length };
  }

  public Dispatch: EaCRuntimeHandler = async (req, ctx) => {
    // Iterate project groups in priority order
    for (const group of this.routes) {
      try {
        const activated = await group.Activator?.(req, ctx);

        if (!activated) continue;

        for (const route of group.Routes) {
          const matched = await route.Activator?.(req, ctx);

          if (!matched) continue;

          // Execute the route's pipeline/handler
          const handler = route.Handler as unknown as EaCRuntimeHandlerPipeline;

          return handler.Execute(req, ctx);
        }
      } catch (_err) {
        // If an activator throws, fall through to next group/route
        continue;
      }
    }

    return new Response("Not Found", { status: 404 });
  };
}
