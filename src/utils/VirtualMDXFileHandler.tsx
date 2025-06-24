// deno-lint-ignore-file no-explicit-any
import {
  DFSFileHandler,
  EaCDistributedFileSystemDetails,
  ESBuild,
  IoCContainer,
  path,
} from "../preact/.deps.ts";
import { compile } from "npm:@mdx-js/mdx@3.1.0";
import matter from "npm:gray-matter@4.0.3";
import remarkGfm from "npm:remark-gfm@4.0.1";
import remarkFrontmatter from "npm:remark-frontmatter@5.0.0";
import rehypeSlug from "npm:rehype-slug@6.0.0";
import rehypeAutolinkHeadings from "npm:rehype-autolink-headings@7.1.0";
import { getPackageLoggerSync } from "jsr:@fathym/common@0.2.264/log";
import { DFSFileInfo } from "jsr:@fathym/eac@0.2.112/dfs/handlers";
import { bufferToStream } from "./bufferToStream.tsx";

export class VirtualMDXFileHandler extends DFSFileHandler {
  public constructor(
    dfsLookup: string,
    details: EaCDistributedFileSystemDetails,
    protected mdxFilePath: string,
    protected originalMDXSource: string,
    protected ioc: IoCContainer,
    protected isIsland: boolean = false,
    protected options: {
      remarkPlugins?: any[];
      rehypePlugins?: any[];
    } = {},
  ) {
    super(dfsLookup, details, getPackageLoggerSync(import.meta));
  }

  public get Root(): string {
    const dfsId = this.dfsLookup.replace(/[^a-zA-Z0-9-_]/g, "_");
    return path.join(Deno.cwd(), "_compiled", "virtual-mdx", dfsId);
  }

  public async GetFileInfo(
    _filePath: string,
    _revision: string,
  ): Promise<DFSFileInfo> {
    const { content: mdxBody } = matter(this.originalMDXSource);

    const result = await compile(mdxBody, {
      jsx: true,
      jsxRuntime: "automatic",
      jsxImportSource: "preact",
      outputFormat: "program",
      remarkPlugins: [
        remarkGfm,
        remarkFrontmatter,
        ...(this.options.remarkPlugins ?? []),
      ],
      rehypePlugins: [
        rehypeSlug,
        rehypeAutolinkHeadings,
        ...(this.options.rehypePlugins ?? []),
      ],
    });

    const compiled = String(result.value);

    const esbuild = await this.ioc.Resolve<ESBuild>(this.ioc.Symbol("ESBuild"));

    const transpiled = await esbuild.transform(compiled, {
      loader: "tsx",
      format: "esm",
      jsx: "automatic",
    });

    const outputPath = await this.persistToDisk(transpiled.code);

    const runtimeCode = transpiled.code.replace(
      'import { Fragment, jsx, jsxs } from "preact/jsx-runtime";\n',
      'import { jsx, jsxs } from "preact/jsx-runtime";',
    );

    return {
      Path: `file://${outputPath}`,
      ImportPath: `file://${outputPath}`,
      Contents: bufferToStream(new TextEncoder().encode(runtimeCode)),
    };
  }

  public async LoadAllPaths(_revision: string): Promise<string[]> {
    const relativePath = this.mdxFilePath
      .replace(/^\/+/, "")
      .replace(/\.(mdx|md)$/, ".tsx");

    return [path.join(this.Root, relativePath)];
  }

  public async RemoveFile(): Promise<void> {
    throw new Deno.errors.NotSupported(
      "RemoveFile not supported in VirtualMDXFileHandler.",
    );
  }

  public async WriteFile(): Promise<void> {
    throw new Deno.errors.NotSupported(
      "WriteFile not supported in VirtualMDXFileHandler.",
    );
  }

  protected async persistToDisk(code: string): Promise<string> {
    const baseDir = this.Root;

    const relativePath = this.mdxFilePath
      .replace(/^\/+/, "")
      .replace(/\.(mdx|md)$/, ".tsx");

    const fullPath = path.join(baseDir, relativePath);
    const fullDir = path.dirname(fullPath);

    await Deno.mkdir(fullDir, { recursive: true });
    await Deno.writeTextFile(fullPath, code);

    return fullPath;
  }
}
