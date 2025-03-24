// deno-lint-ignore-file no-explicit-any
import { compile } from "npm:@mdx-js/mdx@3.1.0";
import remarkFrontmatter from "npm:remark-frontmatter@5.0.0";
import remarkGfm from "npm:remark-gfm@4.0.1";
import rehypeSlug from "npm:rehype-slug@6.0.0";
import rehypeAutolinkHeadings from "npm:rehype-autolink-headings@7.1.0";
import {
  ComponentType,
  EaCRuntimeHandlerSet,
  ESBuild,
  IoCContainer,
} from "../preact/.deps.ts";

// TypeScript doesn't know about the full MDXConfig type structure, define a generic
export type DocsMDXOptions = {
  remarkPlugins?: any[];
  rehypePlugins?: any[];
  [key: string]: unknown;
};

export async function compileMDX(
  ioc: IoCContainer,
  mdxSource: string,
  config?: DocsMDXOptions,
): Promise<
  {
    compiled: ComponentType<any>;
    handler: EaCRuntimeHandlerSet;
    source: string;
  } | undefined
> {
  try {
    const result = await compile(mdxSource, {
      jsx: true,
      jsxRuntime: "automatic",
      jsxImportSource: "preact",
      outputFormat: "program",
      remarkPlugins: [remarkGfm, ...(config?.remarkPlugins ?? [])],
      rehypePlugins: [
        rehypeSlug,
        rehypeAutolinkHeadings,
        ...(config?.rehypePlugins ?? []),
      ],
      ...config,
    });

    const compiledJSX = String(result.value);

    const esbuild = await ioc.Resolve<ESBuild>(ioc.Symbol("ESBuild"));

    const transpiled = await esbuild.transform(compiledJSX, {
      loader: "tsx",
      format: "esm",
      jsx: "automatic",
    });

    const encoded = btoa(unescape(encodeURIComponent(transpiled.code)));

    const module = await import(`data:text/javascript;base64,${encoded}`);

    return module
      ? {
        compiled: module.default,
        source: transpiled.code,
        handler: module.handler ||
          (((_req, ctx) => {
            return ctx.Next();
          }) as EaCRuntimeHandlerSet),
      }
      : undefined;
  } catch (err) {
    return undefined;
    // throw ne hJSON.stringify(err, null, 4);
  }
}
