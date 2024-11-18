import { EaCUserRecord } from "../.deps.ts";

export type EaCStewardAPIState = {
  EnterpriseLookup: string;

  StewardJWT: string;

  UserEaC: EaCUserRecord;

  Username: string;
};
