import {
  EaCAPIJWTPayload,
  EaCRuntimeHandler,
  EaCStewardClient,
  EaCUserRecord,
  EverythingAsCode,
  loadEaCStewardSvc,
  loadJwtConfig,
} from "../.deps.ts";
import { EaCState } from "../state/EaCState.ts";

export function buildEaCAPIMiddleware(): EaCRuntimeHandler<EaCState> {
  return async (_req, ctx) => {
    let eac: EverythingAsCode | undefined = undefined;

    ctx.State.ParentSteward = await loadEaCStewardSvc();

    const entLookup = ctx.State.EnterpriseLookup!;

    const username = ctx.State.Username!;

    const jwt = await ctx.State.ParentSteward.EaC.JWT(entLookup, username);

    ctx.State.EaCJWT = jwt.Token;

    ctx.State.Steward = await loadEaCStewardSvc(ctx.State.EaCJWT);

    ctx.State.EaC = await ctx.State.Steward.EaC.Get();

    if (!ctx.State.EaC) {
      ctx.State.EaCJWT = undefined;

      ctx.State.Steward = undefined;
    }

    const resp = ctx.Next();

    return resp;
  };
}
