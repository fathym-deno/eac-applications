import { EaCRuntimeHandlers, EaCUserRecord } from "../.deps.ts";
import { EaCStewardAPIState } from "../state/EaCStewardAPIState.ts";

export default {
  async GET(req, ctx) {
    const logger = ctx.Runtime.Logs;

    const url = new URL(req.url);

    // TODO(mcgear): Remove this once we update everything
    const username = url.searchParams.get("username") ?? ctx.State.Username!;

    const parentEntLookup = url.searchParams.get("parentEntLookup");

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

    const userEaCResults = await eacKv.list<EaCUserRecord>({
      prefix: ["User", username, "EaC"],
    });

    const userEaCRecords: EaCUserRecord[] = [];

    try {
      for await (const userEaCRecord of userEaCResults) {
        if (
          !parentEntLookup ||
          userEaCRecord.value.ParentEnterpriseLookup === parentEntLookup
        ) {
          userEaCRecords.push(userEaCRecord.value);
        }
      }
    } catch (err) {
      logger.Package.error(
        `The was an error processing the user eac results for '${username}'`,
        err,
      );
    }

    // const userEaCs = await denoKv.getMany<EverythingAsCode[]>(
    //   userEaCRecords.map((userEaC) => ["EaC", userEaC.EnterpriseLookup]),
    // );

    // const eacs = userEaCs.map((eac) => eac.value!);

    return Response.json(userEaCRecords);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
