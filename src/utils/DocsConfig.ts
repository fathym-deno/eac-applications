import { MDXConfig } from "../runtime/processors/EaCMDXProcessorHandlerResolver.ts";
import { DocsNavItem } from "./DocsNavItem.ts";

/**
 * Documentation site configuration for the EaCMDXProcessor.
 */
export type DocsConfig = {
  /** The title of the documentation site. */
  Title: string;

  /** Navigation structure for the documentation site. */
  Nav: DocsNavItem[];

  /** MDX Processing options (plugins, settings, etc.). */
  MDX: MDXConfig;
};
