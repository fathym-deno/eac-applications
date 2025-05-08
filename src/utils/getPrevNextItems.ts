import type { DocsNavItem } from "./DocsNavItem.ts";
import type { DocsConfig } from "./DocsConfig.ts";
import { flattenNav } from "./flattenNav.ts";

export function getPrevNextItems(
  docsConfig: DocsConfig,
  currentPath: string,
): {
  prev?: DocsNavItem;
  next?: DocsNavItem;
} {
  const flat = flattenNav(docsConfig.Nav); // ✅ Use docsConfig.Nav here
  const index = flat.findIndex(
    (item) => item.Path === (currentPath ? currentPath : "/"),
  );

  return {
    prev: index > 0 ? flat[index - 1] : undefined,
    next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : undefined,
  };
}
