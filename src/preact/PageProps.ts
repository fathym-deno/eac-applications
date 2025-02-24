// deno-lint-ignore-file no-explicit-any
import { ComponentType } from "./.deps.ts";

export type PageProps<TData = any> = {
  Component: ComponentType<unknown>;

  Data: TData;

  Params: Record<string, string | undefined>;

  Revision: string;
};
