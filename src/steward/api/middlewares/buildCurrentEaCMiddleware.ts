import {
  EaCAPIJWTPayload,
  EaCRuntimeHandler,
  EaCStewardClient,
  EaCUserRecord,
  EverythingAsCode,
  loadEaCStewardSvc,
  loadJwtConfig,
} from "../.deps.ts";
import { CurrentEaCState } from "../state/CurrentEaCState.ts";

export function buildCurrentEaCMiddleware(
  eacDBLookup: string = "eac",
): EaCRuntimeHandler<CurrentEaCState> {
  return async (_req, ctx) => {
    ctx.State.EaCKV = await ctx.Runtime.IoC.Resolve(Deno.Kv, eacDBLookup);

    const currentEntLookup = await ctx.State.EaCKV.get<string>([
      "User",
      ctx.State.Username!,
      "Current",
      "EnterpriseLookup",
    ]);

    let eac: EverythingAsCode | undefined = undefined;

    ctx.State.ParentSteward = await loadEaCStewardSvc();

    const username = ctx.State.Username!;

    ctx.State.UserEaCs = await ctx.State.ParentSteward.EaC.ListForUser();

    if (currentEntLookup.value) {
      ctx.State.Steward = await loadEaCStewardSvc(
        currentEntLookup.value,
        ctx.State.Username!,
      );

      eac = await ctx.State.Steward.EaC.Get();
    }

    if (!eac) {
      if (ctx.State.UserEaCs[0]) {
        await ctx.State.EaCKV.set(
          ["User", ctx.State.Username!, "Current", "EnterpriseLookup"],
          ctx.State.UserEaCs[0].EnterpriseLookup,
        );

        ctx.State.Steward = await loadEaCStewardSvc(
          ctx.State.UserEaCs[0].EnterpriseLookup,
          username,
        );

        eac = await ctx.State.Steward.EaC.Get();
      }
    }

    if (eac) {
      ctx.State.EaC = eac;

      const jwt = await ctx.State.ParentSteward.EaC.JWT(
        eac.EnterpriseLookup!,
        ctx.State.Username!,
      );

      ctx.State.EaCJWT = jwt.Token;

      ctx.State.Steward = await loadEaCStewardSvc(ctx.State.EaCJWT);
    }

    const resp = ctx.Next();

    return resp;
  };
}
