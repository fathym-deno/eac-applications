import { EaCRuntimeContext } from "../preact/.deps.ts";
import { convertHeadingsToNavItems } from "./convertHeadingsToNavItems.ts";
import { generateDocConfigFromSource } from "./generateDocConfigFromSource.ts";
import { getPrevNextItems } from "./getPrevNextItems.ts";
import { DocsConfig } from "./DocsConfig.ts";
import { DocsNavItem } from "./DocsNavItem.ts";

export function injectDocPageMetadata(
  mdxSource: string,
  docsConfig: DocsConfig,
  ctx: EaCRuntimeContext,
): {
  $DocsConfig: DocsConfig;
  $DocNavItems: DocsNavItem[];
  $PrevPage: DocsNavItem | undefined;
  $NextPage: DocsNavItem | undefined;
} {
  const headings = generateDocConfigFromSource(mdxSource);
  const docNavItems = convertHeadingsToNavItems(headings);

  const { prev, next } = getPrevNextItems(
    docsConfig,
    ctx.Runtime.URLMatch.Path || "",
  );

  return {
    $DocsConfig: docsConfig,
    $DocNavItems: docNavItems,
    $PrevPage: prev,
    $NextPage: next,
  };
}
