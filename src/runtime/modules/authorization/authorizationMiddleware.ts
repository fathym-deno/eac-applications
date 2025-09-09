import {
  EaCApplicationsRuntimeContext,
  EaCRuntimeHandler,
  STATUS_CODE,
} from "../.deps.ts";

/**
 * Resolve effective rights for this request using a pluggable resolver.
 * Falls back to JWT claim and existing ctx.Runtime.AccessRights if no resolver is registered.
 */
async function resolveAccessRights(
  ctx: EaCApplicationsRuntimeContext,
): Promise<string[]> {
  // Fast path
  if (ctx.Runtime.AccessRights && ctx.Runtime.AccessRights.length > 0) {
    return ctx.Runtime.AccessRights;
  }

  // Attempt to use IoC-registered resolver if available
  try {
    const symbol = ctx.Runtime.IoC.Symbol("AccessRightsResolver");
    const resolver = await ctx.Runtime.IoC.Resolve<
      (ctx: EaCApplicationsRuntimeContext) => Promise<{ rights: string[] }>
    >(symbol);

    if (resolver) {
      const { rights } = await resolver(ctx);
      ctx.Runtime.AccessRights = rights || [];
      return ctx.Runtime.AccessRights;
    }
  } catch (_) {
    // No resolver registered; fall back to claim/state
  }

  ctx.Runtime.AccessRights = [];
  return ctx.Runtime.AccessRights;
}

function checkMatch(
  required: string[],
  have: Set<string>,
  isAnyMatch: boolean,
): boolean {
  if (required.length === 0) return true;
  if (isAnyMatch) return required.some((r) => have.has(r));
  return required.every((r) => have.has(r));
}

/**
 * Authorization middleware enforcing global and app-level rights.
 * Assumes authentication (OAuth/JWT) modifiers ran earlier in the pipeline.
 */
export function establishAuthorizationMiddleware(): EaCRuntimeHandler {
  return async (_req, ctx) => {
    const appCtx = ctx as unknown as EaCApplicationsRuntimeContext;

    const resolverCfg =
      appCtx.Runtime.ApplicationProcessorConfig.ResolverConfig;

    // Gather required rights from app resolver config
    const appRequired: string[] = Array.isArray(resolverCfg.AccessRightLookups)
      ? [...resolverCfg.AccessRightLookups]
      : [];

    // If no authz required by app, skip
    const needsAuthz = appRequired.length > 0;

    // Global authorization (soft-typed)
    type GlobalAuth = {
      RequiredRights?: string[];
      DenyRights?: string[];
      IsAnyAccessMatch?: boolean;
    };
    type EacWithGlobal = { $GlobalOptions?: { Authorization?: GlobalAuth } };
    const eacGlobal = appCtx.Runtime.EaC as unknown as EacWithGlobal;
    const globalAuth = eacGlobal?.$GlobalOptions?.Authorization;

    const globalRequired = globalAuth?.RequiredRights ?? [];
    const globalDeny = new Set(globalAuth?.DenyRights ?? []);

    if (!needsAuthz && globalRequired.length === 0 && globalDeny.size === 0) {
      // Nothing to enforce
      // Attach helper and continue
      appCtx.HasAccessRights = async (reqd: string[], matchAll?: boolean) => {
        const rights = await resolveAccessRights(appCtx);
        const have = new Set(rights);
        return checkMatch(reqd, have, resolverCfg.IsAnyAccessMatch ?? false);
      };
      return appCtx.Next();
    }

    const rights = await resolveAccessRights(appCtx);
    const have = new Set(rights);

    // Global deny before anything else
    const isDenied = Array.from(globalDeny).some((r) => have.has(r));
    if (isDenied) {
      return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
    }

    // Global required
    if (globalRequired.length > 0) {
      const ok = checkMatch(
        globalRequired,
        have,
        globalAuth?.IsAnyAccessMatch ?? false,
      );
      if (!ok) {
        return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
      }
    }

    // App-level required
    if (needsAuthz) {
      const ok = checkMatch(
        appRequired,
        have,
        resolverCfg.IsAnyAccessMatch ?? false,
      );
      if (!ok) {
        // If app wanted to trigger sign-in and user is anonymous, we could redirect.
        // Assume OAuth middleware has already done its part for private routes.
        return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
      }
    }

    // Attach helper for handlers
    appCtx.HasAccessRights = async (reqd: string[], isAnyMatch?: boolean) => {
      const rightsEff = appCtx.Runtime.AccessRights ||
        (await resolveAccessRights(appCtx));
      const haveEff = new Set(rightsEff);
      return checkMatch(reqd, haveEff, isAnyMatch ?? false);
    };

    return appCtx.Next();
  };
}
