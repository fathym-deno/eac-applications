import {
  EaCRuntimeHandlers,
  EaCUserRecord,
  EverythingAsCode,
  STATUS_CODE,
} from '../../../.deps.ts';
import { EaCStewardAPIState } from '../../../state/EaCStewardAPIState.ts';

export default {
  async GET(req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup;

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, 'eac');

    const eacUserResults = await eacKv.list<EaCUserRecord>({
      prefix: ['EaC', 'Users', entLookup],
    });

    const userEaCRecords: EaCUserRecord[] = [];

    for await (const userEaCRecord of eacUserResults) {
      userEaCRecords.push(userEaCRecord.value);
    }

    return Response.json({
      HasAccess: !!userEaCRecords.find((uer) => uer.Username == ctx.State.Username),
    });
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
