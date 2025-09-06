import { type EaCRuntimeHandlers, STATUS_CODE } from "../../../.deps.ts";

export default {
  async POST(req, ctx) {
    try {
      const { EaCRefreshController } = await import(
        "../../../../../runtime/refresh/EaCRefreshController.ts"
      );

      const controller = await ctx.Runtime.IoC.Resolve(EaCRefreshController);

      // Optional shared-secret guard on top of JWT validation
      const secret = Deno.env.get("EAC_REFRESH_ENDPOINT_TOKEN");
      if (secret) {
        const provided = req.headers.get("x-eac-refresh-token");
        if (!provided || provided !== secret) {
          return Response.json(
            { swapped: false, message: "Forbidden" },
            { status: STATUS_CODE.Forbidden },
          );
        }
      }

      const url = new URL(req.url);
      const force = url.searchParams.get("force") === "1" ||
        url.searchParams.get("force") === "true";

      const result = await controller.RefreshNow(force);

      return Response.json(result, { status: STATUS_CODE.OK });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Refresh failed";
      return Response.json(
        { swapped: false, message: msg },
        { status: STATUS_CODE.InternalServerError },
      );
    }
  },
} as EaCRuntimeHandlers;
