// deno-lint-ignore-file no-explicit-any
import { unified } from "npm:unified@11.0.5";
import remarkParse from "npm:remark-parse@11.0.0";
import { visit } from "npm:unist-util-visit@5.0.0";

export type DocHeading = {
  depth: number;
  value: string;
};

/** Recursively stringify children (inline nodes) of a heading */
function extractHeadingText(node: any): string {
  if (typeof node === "string") return node;

  if (node.type === "text") return node.value;
  if (node.children) {
    return node.children.map(extractHeadingText).join("");
  }

  return "";
}

export function generateDocConfigFromSource(source: string): DocHeading[] {
  const tree = unified().use(remarkParse).parse(source);
  const headings: DocHeading[] = [];

  visit(tree, "heading", (node: any) => {
    const text = extractHeadingText({ children: node.children }).trim();

    if (text) {
      headings.push({
        depth: node.depth,
        value: text,
      });
    }
  });

  return headings;
}
