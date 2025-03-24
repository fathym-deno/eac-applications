import type { DocsNavItem } from "@fathym/eac-applications/runtime/processors";
import { DocHeading } from "./generateDocConfigFromSource.ts";

export function convertHeadingsToNavItems(
  headings: DocHeading[],
): DocsNavItem[] {
  const root: DocsNavItem[] = [];
  const stack: { level: number; items: DocsNavItem[] }[] = [
    { level: 0, items: root },
  ];

  for (const heading of headings) {
    const id = heading.value
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    const navItem: DocsNavItem = {
      Title: heading.value,
      Path: `#${id}`,
    };

    // Find the correct nesting level
    while (stack.length > 1 && heading.depth <= stack[stack.length - 1].level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].items;
    parent.push(navItem);

    // Push to stack if this item can have children
    stack.push({ level: heading.depth, items: (navItem.Children = []) });
  }

  return root;
}
