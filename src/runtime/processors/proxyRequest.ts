import { STATUS_CODE, establishHeaders, processCacheControlHeaders, redirectRequest } from "./.deps.ts";

function normalizeRelativePath(path: string): string {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeBasePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function buildClientPath(base: string, relative: string): string {
  const normalizedBase = normalizeBasePath(base);
  const normalizedRelative = normalizeRelativePath(relative);

  let clientPath = normalizedRelative === "/"
    ? normalizedBase
    : `${normalizedBase}${normalizedRelative}`;

  if (!clientPath) {
    clientPath = "/";
  }

  if (!clientPath.startsWith("/")) {
    clientPath = `/${clientPath}`;
  }

  return clientPath;
}

export async function proxyRequest(
  req: Request,
  proxyRoot: string,
  base: string,
  path: string,
  headers?: Record<string, string>,
  search?: string,
  hash?: string,
  redirectMode?: "error" | "follow" | "manual",
  cacheControl?: Record<string, string>,
  forceCache?: boolean,
): Promise<Response> {
  const baseUrl = new URL(base);

  const clientPath = buildClientPath(baseUrl.pathname, path);

  const originalUrl = new URL(baseUrl.origin);
  originalUrl.pathname = clientPath;
  originalUrl.search = search ?? "";
  originalUrl.hash = hash ?? "";

  const proxyUrl = new URL(`${proxyRoot}${path}`.replace("//", "/"));

  originalUrl.searchParams.forEach((value, key) => {
    proxyUrl.searchParams.append(key, value);
  });

  proxyUrl.hash = originalUrl.hash;

  let reqHeaders = establishHeaders(req.headers, headers ?? {});
  reqHeaders = establishHeaders(reqHeaders, {
    "x-forwarded-host": originalUrl.host,
    "x-forwarded-proto": originalUrl.protocol,
    "x-eac-forwarded-host": originalUrl.host,
    "x-eac-forwarded-path": clientPath,
    "x-eac-forwarded-proto": originalUrl.protocol,
  });

  const requestClone = req as unknown as Record<string, unknown>;
  const proxyReqInit: Record<string, unknown> = [
    "body",
    "method",
    "redirect",
    "signal",
  ].reduce(
    (acc, key) => {
      acc[key] = requestClone[key];
      return acc;
    },
    {} as Record<string, unknown>,
  );

  const proxyReq = new Request(proxyUrl, {
    ...proxyReqInit,
    headers: reqHeaders,
  });

  let resp = await fetch(proxyReq, {
    redirect: redirectMode ?? "manual",
    credentials: "include",
  });

  const redirectLocation = resp.headers.get("location");

  if (redirectLocation) {
    return redirectRequest(
      redirectLocation,
      resp.status,
      undefined,
      resp.headers,
    );
  }

  if (
    resp.status === STATUS_CODE.SwitchingProtocols &&
    resp.headers.get("upgrade") === "websocket"
  ) {
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    const proxySocket = new WebSocket(proxyUrl);

    let proxySocketOpen = false;
    const pendingMessages: string[] = [];

    proxySocket.addEventListener("open", () => {
      proxySocketOpen = true;
      for (const msg of pendingMessages) {
        proxySocket.send(msg);
      }
      pendingMessages.length = 0;
    });

    proxySocket.addEventListener("message", (proxyMsg) => {
      try {
        clientSocket.send(proxyMsg.data);
      } catch (err) {
        console.error("[proxyRequest] Failed to forward proxy -> client:", err);
      }
    });

    proxySocket.addEventListener("close", () => {
      clientSocket.close();
    });

    proxySocket.addEventListener("error", (err) => {
      console.error("[proxyRequest] Proxy socket error:", err);
      clientSocket.close();
    });

    clientSocket.addEventListener("message", (clientMsg) => {
      if (proxySocketOpen) {
        proxySocket.send(clientMsg.data);
      } else {
        pendingMessages.push(clientMsg.data);
      }
    });

    clientSocket.addEventListener("close", () => {
      proxySocket.close();
    });

    clientSocket.addEventListener("error", (err) => {
      console.error("[proxyRequest] Client socket error:", err);
      proxySocket.close();
    });

    return response;
  }

  if (cacheControl) {
    resp = processCacheControlHeaders(resp, cacheControl, forceCache);
  }

  return resp;
}