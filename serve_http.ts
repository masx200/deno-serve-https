import { Handler } from "./Handler.ts";
import { Handlers } from "./Handlers.ts";
import { hostnameForDisplay } from "./hostnameForDisplay.ts";
import { on_Error } from "./on_Error.ts";
import { on_NotFound } from "./on_NotFound.ts";
import { on_tcp_connection } from "./on_tcp_connection.ts";
import { ServeHttpInit } from "./ServeHttpInit.ts";

export async function serve_http(
    handlers: Handlers | Handler = {},
    {
        port = 8000,
        hostname = "0.0.0.0",
        onNotFound = on_NotFound,
        onError = on_Error,
        ...rest
    }: ServeHttpInit = {},
): Promise<void> {
    const { signal } = rest;
    if (signal?.aborted) {
        return;
    }
    const server = Deno.listen({
        ...rest,
        port: port,
        hostname,
    });

    signal?.addEventListener("abort", () => server.close());
    try {
        if ("onListen" in rest) {
            rest.onListen?.({ port, hostname });
        } else {
            console.log(
                `Listening on http://${hostnameForDisplay(hostname)}:${port}/`,
            );
        }
        for await (const conn of server) {
            if (signal?.aborted) {
                return;
            }
            on_tcp_connection({
                conn,
                handlers: typeof handlers === "function"
                    ? { request: handlers }
                    : handlers,
                onError,
                signal: signal,
                onNotFound,
            }).catch(console.error);
        }
    } catch (error) {
        throw error;
    } finally {
        try {
            server.close();
        } catch {
            /*  (error) */// console.error(error);
        }
    }
}
