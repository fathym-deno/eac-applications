import {
  EaCRuntimeHandlers,
  EaCStatus,
  EaCStatusProcessingTypes,
} from "../../../.deps.ts";
import { EaCStewardAPIState } from "../../../state/EaCStewardAPIState.ts";

export default {
  async GET(_req, ctx) {
    const entLookup = ctx.State.UserEaC!.EnterpriseLookup;

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

    const status = await eacKv.get<EaCStatus>([
      "EaC",
      "Status",
      entLookup,
      "EaC",
    ]);

    const idleStatus: EaCStatus = {
      ID: "",
      Messages: {},
      EnterpriseLookup: entLookup,
      Processing: EaCStatusProcessingTypes.IDLE,
      StartTime: new Date(Date.now()),
      Username: "system",
    };

    return Response.json(status?.value! || idleStatus);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
