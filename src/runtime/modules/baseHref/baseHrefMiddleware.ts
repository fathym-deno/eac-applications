import {
  DOMParser,
  EaCRuntimeHandler,
  Element,
  initParser,
  Logger,
} from "../.deps.ts";

function ensureTrailingSlash(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

export function establishBaseHrefMiddleware(logger: Logger): EaCRuntimeHandler {
  const initCheck = new Promise<boolean>((resolve) => {
    logger.debug("Configuring keep alive...");

    initParser().then(() => resolve(true));
  });

  initCheck.then();

  return async (req, ctx) => {
    let resp = await ctx.Next();

    const contType = resp.headers.get("Content-type");

    if (contType?.includes("text/html")) {
      await initCheck;

      let baseHref = ctx.Runtime.URLMatch?.Base ?? new URL(req.url).origin;
      baseHref = ensureTrailingSlash(baseHref);

      const htmlStr = await resp.clone().text();

      const doc = new DOMParser().parseFromString(htmlStr, "text/html");

      if (doc) {
        const baseScriptNode = doc.head.querySelector("base") ??
          doc.createElement("base");
        baseScriptNode.setAttribute("href", baseHref);

        if (!doc.head.querySelector("base")) {
          doc.head.prepend(baseScriptNode);
        }

        const docHtml = doc.childNodes[1] as Element;

        const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

        resp = new Response(fullDoc, resp);
      }
    }

    return resp;
  };
}
