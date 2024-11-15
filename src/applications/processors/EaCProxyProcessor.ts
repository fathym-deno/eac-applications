import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The proxy processor.
 */
export type EaCProxyProcessor = {
  /** The headers to be sent with the proxy request. */
  Headers?: Record<string, string>;

  /** The root URL of the proxy server. */
  ProxyRoot: string;

  /** The mode for handling redirects. */
  RedirectMode?: "error" | "follow" | "manual";
} & EaCProcessor<"Proxy">;

/**
 * Type Guard: Checks if the given object is an EaCProxyProcessor.
 *
 * @param proc The proxy processor.
 * @returns true if the given processor is a proxy processor, false otherwise.
 */
export function isEaCProxyProcessor(proc: unknown): proc is EaCProxyProcessor {
  const x = proc as EaCProxyProcessor;

  return (
    isEaCProcessor("Proxy", x) &&
    x.ProxyRoot !== undefined &&
    typeof x.ProxyRoot === "string"
  );
}
