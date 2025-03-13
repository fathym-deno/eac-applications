import {
  EaCAPIJWTPayload,
  EaCStewardClient,
  EverythingAsCode,
} from "../.deps.ts";

export type EaCState<TEaC extends EverythingAsCode = EverythingAsCode> = {
  EaC?: TEaC;

  EaCJWT?: string;

  ParentSteward?: EaCStewardClient;

  Steward?: EaCStewardClient;
} & EaCAPIJWTPayload;
