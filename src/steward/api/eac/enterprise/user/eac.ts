import {
  EaCRuntimeHandlers,
  EaCUserRecord,
  EverythingAsCode,
  STATUS_CODE,
} from "../../../.deps.ts";
import { EaCStewardAPIState } from "../../../state/EaCStewardAPIState.ts";

export default {
  async GET(req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup;

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

    const eacUserResults = await eacKv.list<EaCUserRecord>({
      prefix: ["EaC", "Users", entLookup],
    });

    const userEaCRecords: EaCUserRecord[] = [];

    for await (const userEaCRecord of eacUserResults) {
      userEaCRecords.push(userEaCRecord.value);
    }

    const userEaC = userEaCRecords.find(
      (uer) => uer.Username == ctx.State.Username,
    );

    if (userEaC) {
      return Response.json(userEaC);
    } else {
      Response.json(
        {
          Message: "You doo not have access to the requested EaC.",
        },
        {
          status: STATUS_CODE.NotFound,
        },
      );
    }
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
