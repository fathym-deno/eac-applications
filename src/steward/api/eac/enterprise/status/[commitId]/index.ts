import { EaCRuntimeHandlers, EaCStatus } from "../../../../.deps.ts";
import { EaCStewardAPIState } from "../../../../state/EaCStewardAPIState.ts";

export default {
  async GET(_req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup;

    const commitId = ctx.Params.commitId as string;

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

    const status = await eacKv.get<EaCStatus>([
      "EaC",
      "Status",
      entLookup,
      "ID",
      commitId,
    ]);

    return Response.json(status?.value! || {});
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
