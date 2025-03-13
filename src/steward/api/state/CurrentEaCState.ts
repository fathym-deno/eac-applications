import { EaCUserRecord, EverythingAsCode } from "../.deps.ts";
import { EaCState } from "./EaCState.ts";

export type CurrentEaCState<TEaC extends EverythingAsCode = EverythingAsCode> =
  & {
    EaCKV?: Deno.Kv;

    UserEaCs?: EaCUserRecord[];
  }
  & EaCState<TEaC>;
