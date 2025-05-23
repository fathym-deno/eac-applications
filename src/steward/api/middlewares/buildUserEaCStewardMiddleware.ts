import { debug } from "../../../runtime/logging/.deps.ts";
import { loadEaCStewardSvc } from "../../../runtime/plugins/.deps.ts";
import { EaCRuntimeHandler, EaCUserRecord, STATUS_CODE } from "../.deps.ts";
import { EaCStewardAPIState } from "../state/EaCStewardAPIState.ts";

export const buildUserEaCStewardMiddleware: (
  eacDBLookup?: string,
) => EaCRuntimeHandler<EaCStewardAPIState> = (
  eacDBLookup: string | undefined = "eac",
) => {
  return async (_req, ctx) => {
    const username = ctx.State.Username!;

    const entLookup = ctx.State.EnterpriseLookup!;

    try {
      const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(
        Deno.Kv,
        eacDBLookup,
      );

      let userEaC = await eacKv.get<EaCUserRecord>([
        "User",
        username,
        "EaC",
        entLookup,
      ]);

      if (!userEaC.value) {
        userEaC = await eacKv.get<EaCUserRecord>([
          "User",
          username,
          "Archive",
          "EaC",
          entLookup,
        ]);
      }

      if (userEaC.value) {
        ctx.State.UserEaC = userEaC.value;

        return ctx.Next();
      }
    } catch (err) {
      ctx.Runtime.Logs.Package.error(
        "There was an error retrieving the enterprise for the user.",
      );
      ctx.Runtime.Logs.Package.error(err);
    }

    return Response.json(
      {
        Message: `You do not have access to the enterprise '${entLookup}'.`,
      },
      {
        status: STATUS_CODE.Unauthorized,
      },
    );
  };
};
