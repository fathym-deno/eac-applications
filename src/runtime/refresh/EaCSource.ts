import { djwt, type EverythingAsCode, loadEaCStewardSvc } from "./.deps.ts";

export type EaCFetchResult = {
  eac: EverythingAsCode;
  enterprise?: string;
  hash: string;
};

export class EaCSource {
  protected async computeHash(obj: unknown): Promise<string> {
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const digest = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  public async FetchFromEnv(): Promise<EaCFetchResult | undefined> {
    let eacApiKey = Deno.env.get("EAC_API_KEY");

    if (!eacApiKey) {
      const eacApiEntLookup = Deno.env.get("EAC_API_ENTERPRISE_LOOKUP");

      if (eacApiEntLookup) {
        const eacApiUsername = Deno.env.get("EAC_API_USERNAME");

        // Lazy import to avoid circular deps; loadJwtConfig is provided by deps in plugins scope
        const { loadJwtConfig } = await import("./.deps.ts");

        eacApiKey = await loadJwtConfig().Create(
          {
            EnterpriseLookup: eacApiEntLookup,
            Username: eacApiUsername,
          },
          60 * 60 * 1,
        );
      }
    }

    if (!eacApiKey) return undefined;

    const [_header, payload] = await djwt.decode(eacApiKey);

    const { EnterpriseLookup } = payload as Record<string, string>;

    const eacSvc = await loadEaCStewardSvc(eacApiKey);

    const eac = await eacSvc.EaC.Get();

    if (eac && !eac.EnterpriseLookup && EnterpriseLookup) {
      eac.EnterpriseLookup = EnterpriseLookup;
    }

    const hash = await this.computeHash(eac);

    return { eac, enterprise: eac.EnterpriseLookup || EnterpriseLookup, hash };
  }
}
