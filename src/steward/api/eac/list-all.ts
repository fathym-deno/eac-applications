import { EaCRuntimeHandlers, EverythingAsCode } from "../.deps.ts";
import { EaCStewardAPIState } from "../state/EaCStewardAPIState.ts";

export default {
  async GET(req, ctx) {
    const logger = ctx.Runtime.Logs;

    const parentEntLookup = ctx.State.EnterpriseLookup!;

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

    // List all current EaC containers. These are stored under
    // ["EaC", "Current", <EnterpriseLookup>]
    const eacResults = await eacKv.list<EverythingAsCode>({
      prefix: ["EaC", "Current"],
    });

    const eacs: EverythingAsCode[] = [];

    try {
      for await (const eacRecord of eacResults) {
        const eac = eacRecord.value;

        // If a parent enterprise is provided in the JWT, only include children
        if (
          !parentEntLookup ||
          eac.ParentEnterpriseLookup === parentEntLookup ||
          // Allow top-level when no parent is enforced
          (!eac.ParentEnterpriseLookup && !parentEntLookup)
        ) {
          // Trim to core props to keep payload small for listings
          eacs.push({
            EnterpriseLookup: eac.EnterpriseLookup,
            ParentEnterpriseLookup: eac.ParentEnterpriseLookup,
            Details: eac.Details,
          } as EverythingAsCode);
        }
      }
    } catch (err) {
      logger.Package.error(
        `There was an error processing the EaC list-all results`,
        err,
      );
    }

    return Response.json(eacs);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
