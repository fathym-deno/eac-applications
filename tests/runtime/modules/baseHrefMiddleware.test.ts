import type { Logger } from "../../../src/runtime/modules/.deps.ts";
import { assert } from "../../test.deps.ts";
import { establishBaseHrefMiddleware } from "../../../src/runtime/modules/baseHref/baseHrefMiddleware.ts";

function createLogger(): Logger {
  return {
    critical: () => {},
    debug: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  } as unknown as Logger;
}

function createCtx(base: string, path: string | undefined, html: string) {
  return {
    Runtime: {
      URLMatch: {
        Base: base,
        Path: path,
      },
    },
    Next: () =>
      Promise.resolve(
        new Response(html, {
          headers: {
            "Content-Type": "text/html",
          },
        }),
      ),
  } as unknown;
}

const htmlDoc = "<html><head></head><body><h1>Hi</h1></body></html>";

Deno.test("uses forwarded headers to compute nested base href", async () => {
  const middleware = establishBaseHrefMiddleware(createLogger());

  const ctx = createCtx("http://admin-runtime/", "/users", htmlDoc);

  const req = new Request("http://admin-runtime/users", {
    headers: {
      "x-eac-forwarded-proto": "http:",
      "x-eac-forwarded-host": "localhost:5410",
      "x-eac-forwarded-path": "/admin/users",
    },
  });

  const resp = await (middleware as any)(req, ctx);
  const body = await resp.text();

  assert(body.includes('<base href="http://localhost:5410/admin/">'));
});

Deno.test("falls back to runtime base when forwarded headers are absent", async () => {
  const middleware = establishBaseHrefMiddleware(createLogger());

  const ctx = createCtx("http://admin-runtime/", "/users", htmlDoc);

  const req = new Request("http://admin-runtime/users");

  const resp = await (middleware as any)(req, ctx);
  const body = await resp.text();

  assert(body.includes('<base href="http://admin-runtime/">'));
});

Deno.test("trims trailing slash when forwarded root path is provided", async () => {
  const middleware = establishBaseHrefMiddleware(createLogger());

  const ctx = createCtx("http://admin-runtime/", "/", htmlDoc);

  const req = new Request("http://admin-runtime/", {
    headers: {
      "x-eac-forwarded-proto": "https:",
      "x-eac-forwarded-host": "example.com",
      "x-eac-forwarded-path": "/admin/",
    },
  });

  const resp = await (middleware as any)(req, ctx);
  const body = await resp.text();

  assert(body.includes('<base href="https://example.com/admin/">'));
});

