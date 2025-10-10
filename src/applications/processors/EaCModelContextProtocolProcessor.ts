import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * Configuration for an MCP (Model Context Protocol) processor.
 *
 * Points the runtime at a DFS location that contains the MCP micro-framework
 * files (e.g., `.mcp.ts`, `tools/*.tool.ts`, `resources/*.resource.ts`, etc.).
 */
export type EaCModelContextProtocolProcessor = {
  /**
   * Lookup reference for the DFS that hosts the MCP capability handlers.
   * Mirrors how API/NATS processors reference their DFS roots.
   */
  DFSLookup: string;

  /**
   * Optional profile lookup that can be used to resolve default MCP profile
   * metadata (name, description, auth requirements) from EaC.
   */
  ProfileLookup?: string;
} & EaCProcessor<"MCP">;

/**
 * Type guard for {@link EaCModelContextProtocolProcessor}.
 *
 * @param proc - Potential MCP processor object.
 * @returns `true` if the object is an MCP processor.
 */
export function isEaCModelContextProtocolProcessor(
  proc: unknown,
): proc is EaCModelContextProtocolProcessor {
  const x = proc as EaCModelContextProtocolProcessor;

  return (
    isEaCProcessor("MCP", x) &&
    typeof x?.DFSLookup === "string" &&
    x.DFSLookup.length > 0
  );
}
