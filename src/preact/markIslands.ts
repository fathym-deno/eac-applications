// deno-lint-ignore-file no-explicit-any
import { ComponentType } from "preact";

export function markIslands(root: ComponentType<any>): ComponentType<any> {
  return root;
}
