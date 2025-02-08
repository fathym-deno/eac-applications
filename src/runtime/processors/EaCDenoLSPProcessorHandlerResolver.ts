import {
  EAC_RUNTIME_DEV,
  EaCDenoLSPProcessor,
  isEaCDenoLSPProcessor,
} from "./.deps.ts";
import { ProcessorHandlerResolver } from "./ProcessorHandlerResolver.ts";

export const EaCDenoLSPProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(_ioc, appProcCfg) {
    if (!isEaCDenoLSPProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCDenoLSPProcessorHandlerResolver.",
      );
    }

    const _processor = appProcCfg.Application.Processor as EaCDenoLSPProcessor;

    // Spawn the Deno LSP process using Deno.Command
    const lspProcess = new Deno.Command("deno", {
      args: ["lsp"],
      stdin: "piped",
      stdout: "piped",
      stderr: "inherit",
    }).spawn();

    return async (req, ctx) => {
      const lspPattern = new URLPattern({ pathname: "*" });

      if (
        req.headers.get("upgrade") === "websocket" &&
        lspPattern.test(req.url)
      ) {
        // Upgrade the connection to WebSocket
        const { socket, response } = Deno.upgradeWebSocket(req);

        // Handle communication between WebSocket and LSP process
        socket.addEventListener("message", async (event) => {
          if (typeof event.data === "string") {
            const lspRequest = new TextEncoder().encode(event.data + "\n");
            await lspProcess.stdin.getWriter().write(lspRequest);
          }
        });

        // Read LSP responses and forward them to the WebSocket client
        (async () => {
          const decoder = new TextDecoder();
          const reader = lspProcess.stdout.getReader();

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const message = decoder.decode(value);
              socket.send(message);
            }
          } finally {
            reader.releaseLock();
          }
        })();

        socket.addEventListener("close", () => {
          lspProcess.stdin.getWriter().close();
        });

        return response;
      } else {
        return await ctx.Next();
      }
    };
  },
};
