import {
  DOMParser,
  EaCRuntimeHandler,
  Element,
  initParser,
  Logger,
} from "../.deps.ts";

export function establishGoogleTagMgrMiddleware(
  logger: Logger,
  googleId: string,
): EaCRuntimeHandler {
  const initCheck = new Promise<boolean>((resolve) => {
    logger.debug("Configuring keep alive...");

    initParser().then(() => resolve(true));
  });

  initCheck.then();

  return async (_req, ctx) => {
    let resp = await ctx.Next();

    const contType = resp.headers.get("Content-type");

    if (contType?.includes("text/html")) {
      await initCheck;

      const htmlStr = await resp.clone().text();

      const doc = new DOMParser().parseFromString(htmlStr, "text/html");

      if (doc) {
        // Google Tag Manager script
        const gtmScript = doc.createElement("script");
        gtmScript.setAttribute("async", "");
        gtmScript.setAttribute(
          "src",
          `https://www.googletagmanager.com/gtag/js?id=${googleId}`,
        );

        const gtmInlineScript = doc.createElement("script");
        gtmInlineScript.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleId}');
        `;

        // Insert the scripts immediately after the opening <head> tag
        doc.head.append(gtmScript);
        doc.head.append(gtmInlineScript);

        const docHtml = doc.childNodes[1] as Element;
        const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

        resp = new Response(fullDoc, resp);
      }
    }

    return resp;
  };
}
