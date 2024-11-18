import {
  EaCMetadataBase,
  EaCRuntimeHandlers,
  EverythingAsCode,
  loadConnections,
} from "../../../.deps.ts";
import { EaCStewardAPIState } from "../../../state/EaCStewardAPIState.ts";

export default {
  async POST(req, ctx) {
    const entLookup = ctx.State.UserEaC!.EnterpriseLookup;

    const eacDef: EverythingAsCode = await req.json();

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

    const eac = await eacKv.get<EverythingAsCode>([
      "EaC",
      "Current",
      entLookup,
    ]);

    const eacValue = eac.value!;

    const eacConnections = ({} as EaCMetadataBase)!;

    const eacDefKeys = Object.keys(eacDef || {});

    const connectionCalls = eacDefKeys.map(async (key) => {
      const def = (eacDef[key as keyof typeof eacDef]! ?? {}) as Record<
        string,
        EaCMetadataBase
      >;

      let lookups = Object.keys(def);

      const current = (eacValue[key as keyof typeof eacValue]! ?? {}) as Record<
        string,
        EaCMetadataBase
      >;

      if (lookups.length === 0) {
        lookups = Object.keys(current);
      }

      const handler =
        eacValue.Actuators![key as keyof typeof eacValue.Actuators];

      if (handler) {
        eacConnections[key as keyof typeof eacConnections] =
          await loadConnections(
            eacKv,
            eacValue,
            handler,
            ctx.State.StewardJWT!,
            def,
            current,
            lookups,
          );
      }
    });

    await Promise.all(connectionCalls);

    return Response.json(eacConnections);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
