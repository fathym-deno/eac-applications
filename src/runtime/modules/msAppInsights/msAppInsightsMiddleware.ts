import {
  DOMParser,
  EaCRuntimeHandler,
  Element,
  initParser,
  Logger,
} from "../.deps.ts";

export function establishMSAppInsightsMiddleware(
  logger: Logger,
  instrumentationKey: string,
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
        // Azure Application Insights script
        const aiScript = doc.createElement("script");
        aiScript.textContent = `
          var appInsights = window.appInsights || function(config) {
            function s(config) { t[config] = function() { var args = arguments; t.queue.push(function() { t[config].apply(t, args); }); }; }
            var t = { config: config }, r = document, u = window, e = "script";
            setTimeout(function() { var s = r.createElement(e); s.src = config.url || "https://js.monitor.azure.com/scripts/b/ai.2.min.js"; r.getElementsByTagName(e)[0].parentNode.appendChild(s); });
            t.queue = [];
            var n = ["trackEvent", "trackPageView", "trackException", "trackTrace", "trackDependencyData", "flush"];
            while (n.length) s(n.pop());
            return t;
          }({
            instrumentationKey: "${instrumentationKey}"
          });

          window.appInsights = appInsights;
          appInsights.trackPageView();
        `;

        // Insert the script immediately after the opening <head> tag
        doc.head.append(aiScript);

        const docHtml = doc.childNodes[1] as Element;
        const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

        resp = new Response(fullDoc, resp);
      }
    }

    return resp;
  };
}
