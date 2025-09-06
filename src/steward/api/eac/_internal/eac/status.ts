import { type EaCRuntimeHandlers, STATUS_CODE } from "../../../.deps.ts";

export default {
  async GET(_req, ctx) {
    try {
      const { EaCRefreshController } = await import(
        "../../../../../runtime/refresh/EaCRefreshController.ts"
      );
      const { RuntimeHost } = await import(
        "../../../../../runtime/refresh/RuntimeHost.ts"
      );

      const controller = await ctx.Runtime.IoC.Resolve(EaCRefreshController);
      const host = await ctx.Runtime.IoC.Resolve(RuntimeHost);

      const ctrl = controller.GetStatus();
      const hostStatus = host.GetStatus();

      return Response.json(
        {
          controller: ctrl,
          host: hostStatus,
        },
        { status: STATUS_CODE.OK },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Status failed";
      return Response.json(
        { message: msg },
        { status: STATUS_CODE.InternalServerError },
      );
    }
  },
} as EaCRuntimeHandlers;
