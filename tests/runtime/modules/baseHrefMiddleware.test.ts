import type {
  EaCRuntimeContext,
  Logger,
} from "../../../src/runtime/modules/.deps.ts";
import { assert, assertEquals } from "../../test.deps.ts";
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

function createCtx(base: string | undefined, html: string) {
  return {
    Runtime: {
      URLMatch: base ? { Base: base } : {},
    },
    Next: () =>
      Promise.resolve(
        new Response(html, {
          headers: {
            "Content-Type": "text/html",
          },
        }),
      ),
  } as EaCRuntimeContext<Record<string, unknown>, Record<string, unknown>>;
}

const htmlDoc = "<html><head></head><body><h1>Hi</h1></body></html>";

Deno.test("uses runtime URLMatch base href", async () => {
  const middleware = establishBaseHrefMiddleware(createLogger());

  const ctx = createCtx("http://localhost:5410/admin/", htmlDoc);
  const req = new Request("http://admin-runtime/users");

  const resp = await middleware(req, ctx);
  const body = await resp.text();

  assert(body.includes('<base href="http://localhost:5410/admin/">'));
});

Deno.test("ensures trailing slash appended to base href", async () => {
  const middleware = establishBaseHrefMiddleware(createLogger());

  const ctx = createCtx("http://admin-runtime", htmlDoc);
  const req = new Request("http://admin-runtime/users");

  const resp = await middleware(req, ctx);
  const body = await resp.text();

  assert(body.includes('<base href="http://admin-runtime/">'));
});

Deno.test(
  "falls back to request origin when URLMatch base missing",
  async () => {
    const middleware = establishBaseHrefMiddleware(createLogger());

    const ctx = createCtx(undefined, htmlDoc);
    const req = new Request("https://fallback.example.com/users");

    const resp = await middleware(req, ctx);
    const body = await resp.text();

    assertEquals(
      body.includes('<base href="https://fallback.example.com/">'),
      true,
    );
  },
);
