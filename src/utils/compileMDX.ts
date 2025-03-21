// deno-lint-ignore-file no-explicit-any
import { compile } from "npm:@mdx-js/mdx@3.1.0";
import remarkFrontmatter from "npm:remark-frontmatter@5.0.0";
import remarkGfm from "npm:remark-gfm@4.0.1";
import rehypeSlug from "npm:rehype-slug@6.0.0";
import rehypeAutolinkHeadings from "npm:rehype-autolink-headings@7.1.0";

// TypeScript doesn't know about the full MDXConfig type structure, define a generic
export type DocsMDXOptions = {
  remarkPlugins?: any[];
  rehypePlugins?: any[];
  [key: string]: unknown;
};

export async function compileMDX(
  mdxSource: string,
  config?: DocsMDXOptions,
): Promise<string> {
  const result = await compile(mdxSource, {
    jsx: true,
    outputFormat: "function-body",
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
      ...(config?.remarkPlugins ?? []),
    ],
    rehypePlugins: [
      rehypeSlug,
      rehypeAutolinkHeadings,
      ...(config?.rehypePlugins ?? []),
    ],
    ...config,
  });

  return String(result.value);
}
