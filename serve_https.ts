import { Handlers } from "./Handlers.ts";
import { hostnameForDisplay } from "./hostnameForDisplay.ts";
import { on_Error } from "./on_Error.ts";
import { on_NotFound } from "./on_NotFound.ts";
import { on_tls_connection } from "./on_tls_connection.ts";
import { ServeHttpsInit } from "./ServeHttpsInit.ts";

export async function serve_https(
    handlers: Handlers = {},
    {
        port = 8000,
        hostname = "0.0.0.0",
        onNotFound = on_NotFound,
        onError = on_Error,
        alpnProtocols = ["h2", "http/1.1"],
        ...rest
    }: ServeHttpsInit = {},
): Promise<void> {
    const { signal } = rest;
    if (signal?.aborted) {
        return;
    }
    const server = Deno.listenTls({
        ...rest,
        port: port,
        hostname,

        alpnProtocols,
    });

    signal?.addEventListener("abort", () => server.close());
    try {
        if ("onListen" in rest) {
            rest.onListen?.({ port, hostname });
        } else {
            console.log(
                `Listening on https://${hostnameForDisplay(hostname)}:${port}/`,
            );
        }
        for await (const conn of server) {
            if (signal?.aborted) {
                return;
            }
            on_tls_connection({
                conn,
                handlers,
                onError,
                signal: signal,
                onNotFound,
            }).catch(console.error);
        }
    } catch (error) {
        throw error;
    } finally {
        server.close();
    }
}
