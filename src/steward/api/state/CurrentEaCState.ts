import {
  EaCAPIJWTPayload,
  EaCStewardClient,
  EaCUserRecord,
  EverythingAsCode,
} from "../.deps.ts";

export type CurrentEaCState<TEaC extends EverythingAsCode = EverythingAsCode> =
  & {
    EaC?: TEaC;

    EaCJWT?: string;

    ParentSteward?: EaCStewardClient;

    Steward?: EaCStewardClient;

    UserEaC: EaCUserRecord;

    UserEaCs?: EaCUserRecord[];
  }
  & EaCAPIJWTPayload;
