// deno-lint-ignore-file no-explicit-any
export function flattenNav(items: any[]): any[] {
  return items.flatMap((item) => [
    item,
    ...(item.Children ? flattenNav(item.Children) : []),
  ]);
}
