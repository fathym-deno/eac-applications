// deno-lint-ignore-file no-explicit-any
import { DOMParser, EaCRuntimeHandler, Element, initParser } from "../.deps.ts";

export function establishStripeMiddleware(
  includeScript: boolean,
): EaCRuntimeHandler {
  const initCheck = new Promise<boolean>((resolve) => {
    initParser().then(() => resolve(true));
  });

  // fire & forget init
  initCheck.then();

  return async (req, ctx) => {
    const log = ctx.Runtime.Logs.Package;

    // Early out if we’re not injecting
    if (!includeScript) {
      log.debug(() => `[stripe-mw] includeScript=false → skipping injection`);
      return ctx.Next();
    }

    // Correlate all messages for this pass
    const traceId = (crypto as any)?.randomUUID?.() ??
      Math.random().toString(36).slice(2, 10);

    const started = Date.now();
    log.debug(
      () =>
        `[stripe-mw][${traceId}] start url=${req.url} includeScript=${includeScript}`,
    );

    let resp: Response | undefined;

    try {
      resp = await ctx.Next();

      if (!resp) {
        log.warn(`[stripe-mw][${traceId}] downstream returned no response`);
        return resp;
      }

      const ct = resp.headers.get("content-type") ?? "";
      log.debug(
        () =>
          `[stripe-mw][${traceId}] downstream status=${
            resp!.status
          } content-type="${ct}"`,
      );

      // Only consider HTML/plain text for injection
      const looksInjectable = ct.includes("text/html") ||
        ct.includes("text/plain");

      if (!looksInjectable) {
        log.info(
          () =>
            `[stripe-mw][${traceId}] skip: non-injectable content-type (${ct})`,
        );
        return resp;
      }

      // Ensure the DOM parser is ready
      await initCheck;

      // Read the body (clone so we don’t consume it)
      let htmlStr = "";
      try {
        htmlStr = await resp.clone().text();
      } catch (err) {
        log.error(
          `[stripe-mw][${traceId}] failed to read response body for inspection`,
          err,
        );
        return resp;
      }

      const len = htmlStr.length;
      const startsLikeHtml = htmlStr.startsWith("<");
      log.debug(
        () =>
          `[stripe-mw][${traceId}] body length=${len} startsWith<${startsLikeHtml}>`,
      );

      if (!startsLikeHtml) {
        log.info(
          () =>
            `[stripe-mw][${traceId}] skip: body did not look like HTML (first char="${
              htmlStr.charAt(0).replace(/\s/g, " ") || "∅"
            }")`,
        );
        return resp;
      }

      // Parse + inject
      try {
        const doc = new DOMParser().parseFromString(htmlStr, "text/html");

        if (!doc) {
          log.warn(`[stripe-mw][${traceId}] DOMParser returned null document`);
          return resp;
        }

        // Some responses may lack <head> (rare, but worth logging)
        // @ts-ignore - Deno DOM has head on Document
        const head: Element | null = (doc as any).head;
        if (!head) {
          log.warn(`[stripe-mw][${traceId}] no <head> element → cannot inject`);
          return resp;
        }

        const script = doc.createElement("script");
        script.setAttribute("src", "https://js.stripe.com/v3");
        script.setAttribute("async", "true");
        head.appendChild(script);

        const docHtml = doc.childNodes[1] as Element;
        const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

        // Build a fresh Response so headers are correct for the new body.
        const headers = new Headers(resp.headers);
        // Content-Length is now wrong; strip it so runtime recalculates.
        headers.delete("content-length");
        // Ensure content type is HTML
        if (!ct.includes("text/html")) {
          headers.set("content-type", "text/html; charset=utf-8");
        }

        const newResp = new Response(fullDoc, {
          status: resp.status,
          statusText: resp.statusText,
          headers,
        });

        log.info(
          () =>
            `[stripe-mw][${traceId}] injected Stripe.js ok (status=${newResp.status})`,
        );

        return newResp;
      } catch (err) {
        log.error(
          `[stripe-mw][${traceId}] failed to parse/inject Stripe.js`,
          err,
        );
        // Fall back to original response if injection fails
        return resp;
      }
    } catch (err) {
      // Catastrophic failure in middleware itself
      log.error(`[stripe-mw][${traceId}] unhandled middleware error`, err);
      throw err; // preserve behavior
    } finally {
      const dur = Date.now() - started;
      log.debug(() => `[stripe-mw][${traceId}] end durationMs=${dur}`);
    }
  };
}
