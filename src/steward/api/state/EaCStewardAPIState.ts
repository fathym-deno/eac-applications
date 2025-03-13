import { EaCAPIJWTPayload, EaCUserRecord } from "../.deps.ts";

export type EaCStewardAPIState = {
  UserEaC: EaCUserRecord;
} & EaCAPIJWTPayload;
