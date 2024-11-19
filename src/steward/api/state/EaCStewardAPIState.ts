import { EaCUserRecord } from "../.deps.ts";

export type EaCStewardAPIState = {
  EnterpriseLookup: string;

  JWT: string;

  UserEaC: EaCUserRecord;

  Username: string;
};
