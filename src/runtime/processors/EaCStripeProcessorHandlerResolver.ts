import {
  EaCRuntimeContext,
  EaCStripeProcessor,
  isEaCStripeProcessor,
  STATUS_CODE,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

export const EaCStripeProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg, _eac) {
    if (!isEaCStripeProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCStripeProcessorHandlerResolver.",
      );
    }

    const processor = appProcCfg.Application.Processor as EaCStripeProcessor;

    // const license = eac.Licenses![processor.LicenseLookup]!;

    // const licDetails = license.Details as EaCLicenseStripeDetails;

    // const stripe = (Stripe as any)(licDetails.SecretKey)!;

    // const licenseKv = await ioc.Resolve(Deno.Kv, processor.DatabaseLookup);

    return Promise.resolve(
      async (
        req,
        ctx: EaCRuntimeContext<{
          Username?: string;
        }>,
      ) => {
        const username = ctx.State.Username as string;

        if (!username) {
          throw new Deno.errors.NotFound(
            "A `ctx.State.Username` value must be provided.",
          );
        }

        if (
          req.method.toUpperCase() === "POST" &&
          ctx.Runtime.URLMatch.Path === "subscribe"
        ) {
          const inpReq = (await req.json()) as {
            PlanLookup: string;

            PriceLookup: string;
          };

          try {
            // const parentEaCSvc = await loadEaCSvc();

            // const licSubRes = await parentEaCSvc.LicenseSubscription(
            //   ctx.Runtime.EaC.EnterpriseLookup!,
            //   username,
            //   processor.LicenseLookup,
            //   inpReq.PlanLookup,
            //   inpReq.PriceLookup
            // );

            const subRes = await processor.HandleSubscription(
              inpReq.PlanLookup,
              inpReq.PriceLookup,
            );

            return Response.json(subRes);
          } catch (error) {
            return Response.json(error, {
              status: STATUS_CODE.BadRequest,
            });
          }
          // } else if (ctx.Runtime.URLMatch.Path === 'webhooks') {
        }

        return ctx.Next();
      },
    );
  },
};
