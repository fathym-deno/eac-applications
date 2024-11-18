import {
  callEaCActuatorConnections,
  EaCMetadataBase,
  EaCModuleActuator,
  EverythingAsCode,
} from "./.deps.ts";

export async function loadConnections(
  denoKv: Deno.Kv,
  currentEaC: EverythingAsCode,
  actuator: EaCModuleActuator,
  jwt: string,
  def: Record<string, EaCMetadataBase>,
  current: Record<string, EaCMetadataBase>,
  lookups: string[],
): Promise<Record<string, EaCMetadataBase>> {
  const mappedCalls = lookups!.map(async (lookup) => {
    return {
      Lookup: lookup,
      Result: await callEaCActuatorConnections(
        async (entLookup) => {
          const eac = await denoKv.get<EverythingAsCode>([
            "EaC",
            "Current",
            entLookup,
          ]);

          return eac.value!;
        },
        actuator,
        jwt,
        {
          Current: current![lookup],
          EaC: currentEaC,
          Lookup: lookup,
          Model: def![lookup],
        },
      ),
    };
  }, {});

  const mapped = await Promise.all(mappedCalls);

  return mapped.reduce((conns, res) => {
    conns[res.Lookup] = res.Result.Model;

    return conns;
  }, {} as Record<string, EaCMetadataBase>);
}
