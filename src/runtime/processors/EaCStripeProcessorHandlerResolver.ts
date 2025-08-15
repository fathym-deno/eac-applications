// deno-lint-ignore-file no-explicit-any
import {
  EaCRuntimeContext,
  EaCStripeProcessor,
  isEaCStripeProcessor,
  STATUS_CODE,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

// ---------- logging helpers ----------
function traceIdFrom(req: Request) {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}
function startTimer() {
  const t0 = performance.now();
  return () => Math.round(performance.now() - t0);
}
function safeError(e: unknown) {
  if (e instanceof Error) {
    return { name: e.name, message: e.message, stack: e.stack };
  }
  try {
    return { message: JSON.stringify(e) };
  } catch {
    return { message: String(e) };
  }
}
// -------------------------------------

export const EaCStripeProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg, _eac) {
    if (!isEaCStripeProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCStripeProcessorHandlerResolver.",
      );
    }

    const processor = appProcCfg.Application.Processor as EaCStripeProcessor;

    return Promise.resolve(
      async (
        req: Request,
        ctx: EaCRuntimeContext<{
          Username?: string;
        }>,
      ) => {
        const log = ctx.Runtime.Logs.Package;
        const traceId = traceIdFrom(req);
        const done = startTimer();

        const path = ctx.Runtime.URLMatch?.Path ?? "(unknown)";
        const method = req.method.toUpperCase();

        log.info(
          () =>
            `[stripe-proc][${traceId}] start method=${method} path=${path} ent=${ctx.Runtime.EaC.EnterpriseLookup}`,
        );

        try {
          const username = ctx.State.Username as string;

          if (!username) {
            log.error(`[stripe-proc][${traceId}] missing ctx.State.Username`);
            // preserve current behavior
            throw new Deno.errors.NotFound(
              "A `ctx.State.Username` value must be provided.",
            );
          }

          if (method === "POST" && path === "subscribe") {
            // read body only for the subscribe route
            const inpReq = (await req.json()) as {
              PlanLookup: string;
              PriceLookup: string;
            };

            log.debug(
              () =>
                `[stripe-proc][${traceId}] subscribe request user=${username} lic=${processor.LicenseLookup} plan=${inpReq?.PlanLookup} price=${inpReq?.PriceLookup}`,
            );

            try {
              const subRes = await processor.HandleSubscription(
                ctx.Runtime.EaC.EnterpriseLookup!,
                username,
                processor.LicenseLookup,
                inpReq.PlanLookup,
                inpReq.PriceLookup,
              );

              // keep debug light & safe
              log.info(
                () =>
                  `[stripe-proc][${traceId}] subscription handled ok for user=${username}`,
              );
              log.debug(
                () =>
                  `[stripe-proc][${traceId}] response keys=${
                    Object.keys(
                      (subRes as any) ?? {},
                    ).join(",")
                  }`,
              );

              return Response.json(subRes);
            } catch (error) {
              log.error(
                `[stripe-proc][${traceId}] subscription error`,
                safeError(error),
              );
              return Response.json(safeError(error), {
                status: STATUS_CODE.BadRequest,
              });
            }
          }

          log.debug(
            () =>
              `[stripe-proc][${traceId}] passthrough → next (method=${method}, path=${path})`,
          );
          return ctx.Next();
        } catch (err) {
          // bubble up unexpected errors after logging
          log.error(
            `[stripe-proc][${traceId}] unhandled error`,
            safeError(err),
          );
          throw err;
        } finally {
          log.debug(
            () => `[stripe-proc][${traceId}] end durationMs=${done()}ms`,
          );
        }
      },
    );
  },
};
