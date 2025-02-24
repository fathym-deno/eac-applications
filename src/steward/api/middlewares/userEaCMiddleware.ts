import { debug } from "../../../runtime/logging/.deps.ts";
import { EaCRuntimeHandler, EaCUserRecord, STATUS_CODE } from "../.deps.ts";
import { EaCStewardAPIState } from "../state/EaCStewardAPIState.ts";

export const userEaCMiddleware: EaCRuntimeHandler<EaCStewardAPIState> = async (
  _req,
  ctx,
) => {
  const username = ctx.State.Username!;

  const entLookup = ctx.State.EnterpriseLookup!;

  // if (entLookup !== ctx.State.EnterpriseLookup) {
  //   return Response.json(
  //     {
  //       Message:
  //         `The current JWT does not have access to the enterprise '${entLookup}'.`,
  //     },
  //     {
  //       status: STATUS_CODE.Unauthorized,
  //     },
  //   );
  // }

  const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

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

  if (!userEaC?.value) {
    return Response.json(
      {
        Message: `You do not have access to the enterprise '${entLookup}'.`,
      },
      {
        status: STATUS_CODE.Unauthorized,
      },
    );
  }

  ctx.State.UserEaC = userEaC.value;

  return ctx.Next();
};
