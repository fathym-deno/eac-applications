import {
  DOMParser,
  EaCRuntimeHandler,
  Element,
  initParser,
  Logger,
} from "../.deps.ts";

type HeadersLike = Pick<Request, "headers">;

type UrlMatchLike = {
  Base: string;
  Path?: string;
};

function normalizeProtocol(proto?: string): string | undefined {
  if (!proto) {
    return undefined;
  }

  return proto.includes(":") ? proto : `${proto}:`;
}

function normalizeRuntimePath(path?: string): string {
  if (!path) {
    return "";
  }

  if (path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function deriveBasePath(
  forwardedPath: string | null,
  runtimePath: string,
  fallbackPath: string,
): string {
  if (!forwardedPath) {
    return fallbackPath || "/";
  }

  let basePath = forwardedPath.startsWith("/")
    ? forwardedPath
    : `/${forwardedPath}`;

  if (basePath.length === 0) {
    return "/";
  }

  if (runtimePath && runtimePath !== "/" && basePath.endsWith(runtimePath)) {
    basePath = basePath.slice(0, basePath.length - runtimePath.length);
  } else if (
    runtimePath === "/" &&
    basePath !== "/" &&
    basePath.endsWith("/")
  ) {
    basePath = basePath.slice(0, -1);
  }

  if (!basePath) {
    basePath = "/";
  }

  if (!basePath.startsWith("/")) {
    basePath = `/${basePath}`;
  }

  return basePath || "/";
}

function computeBaseHref(
  request: HeadersLike,
  urlMatch: UrlMatchLike,
): string {
  const runtimeBaseUrl = new URL(urlMatch.Base);
  const forwardedProto = normalizeProtocol(
    request.headers.get("x-eac-forwarded-proto") ??
      request.headers.get("x-forwarded-proto") ?? undefined,
  ) ?? runtimeBaseUrl.protocol;
  const forwardedHost = request.headers.get("x-eac-forwarded-host") ??
    request.headers.get("x-forwarded-host");
  const forwardedPath = request.headers.get("x-eac-forwarded-path");

  const origin = forwardedHost
    ? new URL(`${forwardedProto}//${forwardedHost}`).origin
    : runtimeBaseUrl.origin;

  const runtimePath = normalizeRuntimePath(urlMatch.Path);
  const basePath = deriveBasePath(
    forwardedPath,
    runtimePath,
    runtimeBaseUrl.pathname,
  );

  const originUrl = new URL(origin);
  originUrl.pathname = basePath || "/";
  originUrl.hash = "";
  originUrl.search = "";

  let baseHref = originUrl.href;

  if (!baseHref.endsWith("/")) {
    baseHref += "/";
  }

  return baseHref;
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

      const baseHref = computeBaseHref(req, ctx.Runtime.URLMatch);

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

