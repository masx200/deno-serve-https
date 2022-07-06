// import { serve } from "https://deno.land/std@0.147.0/http/server.ts";
// import { handler } from "https://deno.land/x/masx200_hello_world_deno_deploy@1.1.5/mod.ts";
// import { parse } from "https://deno.land/std@0.147.0/flags/mod.ts";
// if (import.meta.main) {
//     await main();
// }
export type Handler = (
    request: Request,
    connInfo: ConnInfo,
) => Response | Promise<Response>;
export interface ConnInfo {
    /** The local address of the connection. */
    readonly localAddr: Deno.Addr;
    /** The remote address of the connection. */
    readonly remoteAddr: Deno.Addr;
    alpnProtocol: string | null | undefined;
}
// function upgrade(req: Request, connInfo: ConnInfo) {
//     const { socket, response } = Deno.upgradeWebSocket(req);
//     const { url, headers, method } = req;
//     const data = {
//         ...connInfo,
//         url,
//         method,
//         headers: Object.fromEntries(headers),
//     };

//     const body = JSON.stringify(data);
//     console.log("upgrade", body);
//     socket.addEventListener("open", () => {
//         socket.send(body);
//         socket.close();
//     });
//     return response;
// }
// async function main() {
//     let { port, hostname, certFile, keyFile } = parse(Deno.args);
//     if (port || hostname || certFile || keyFile) {
//         port ??= 8000;
//         hostname ??= "0.0.0.0";
//         await serve_https(
//             { request: handler, upgrade },
//             { port, hostname, certFile, keyFile }
//         );
//     } else {
//         console.log("Listening on http://localhost:8000");

//         await serve(handler, { hostname: "0.0.0.0", port: 8000 });
//     }
// }
export type ServeHttpsInit = Partial<
    Deno.ListenTlsOptions & {
        onNotFound?: Handler;
        signal?: AbortSignal;
        port?: number;
        hostname?: string;
        certFile?: string;
        keyFile?: string;

        onError?: (
            // deno-lint-ignore no-explicit-any
            reason: any,
            request: Request,
            connInfo: ConnInfo,
        ) => Response | PromiseLike<Response>;
        onListen?: (params: { hostname: string; port: number }) => void;
    }
>;
export type ServeHttpInit = Partial<
    Deno.ListenOptions & {
        onNotFound?: Handler;
        signal?: AbortSignal;
        port?: number;
        hostname?: string;

        onError?: (
            // deno-lint-ignore no-explicit-any
            reason: any,
            request: Request,
            connInfo: ConnInfo,
        ) => Response | PromiseLike<Response>;
        onListen?: (params: { hostname: string; port: number }) => void;
    }
>;
function hostnameForDisplay(hostname: string) {
    // If the hostname is "0.0.0.0", we display "localhost" in console
    // because browsers in Windows don't resolve "0.0.0.0".
    // See the discussion in https://github.com/denoland/deno_std/issues/1165
    return hostname === "0.0.0.0" ? "localhost" : hostname;
}
export type Handlers = Partial<{
    request: Handler;
    connect: Handler;
    upgrade: Handler;
}>;
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
export async function serve_http(
    handlers: Handlers = {},
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
export function on_NotFound() {
    return new Response("Not Found", {
        status: 404,
    });
}
async function on_tls_connection({
    conn,
    handlers,
    onError = on_Error,
    signal,
    onNotFound = on_NotFound,
}: {
    signal?: AbortSignal;
    conn: Deno.TlsConn;
    handlers: Handlers;

    onError?: (
        // deno-lint-ignore no-explicit-any
        reason: any,
        request: Request,
        connInfo: ConnInfo,
    ) => Response | PromiseLike<Response>;
    onNotFound?: Handler;
}) {
    if (signal?.aborted) {
        return;
    }
    const { localAddr, remoteAddr } = conn;

    const hand_shake_info = await conn.handshake();
    const { alpnProtocol } = hand_shake_info;
    const conn_info: ConnInfo = {
        localAddr,
        alpnProtocol,
        remoteAddr,
    };
    const httpConn = Deno.serveHttp(conn);
    signal?.addEventListener("abort", function () {
        httpConn.close();
        conn.close();
    });

    for await (const requestEvent of httpConn) {
        if (signal?.aborted) {
            return;
        }

        const promise = requestEventProcessor({
            handlers,
            requestEvent,
            conn_info,
            onError,
            onNotFound,
        }).catch(console.error);
        if (is_connect_or_upgrade(requestEvent.request)) {
            return await promise;
        }
    }
}
async function on_tcp_connection({
    conn,
    handlers,
    onError = on_Error,
    signal,
    onNotFound = on_NotFound,
}: {
    signal?: AbortSignal;
    conn: Deno.Conn;
    handlers: Handlers;

    onError?: (
        // deno-lint-ignore no-explicit-any
        reason: any,
        request: Request,
        connInfo: ConnInfo,
    ) => Response | PromiseLike<Response>;
    onNotFound?: Handler;
}) {
    if (signal?.aborted) {
        return;
    }
    const { localAddr, remoteAddr } = conn;

    // const hand_shake_info =undefined
    // const { alpnProtocol } = hand_shake_info;
    const conn_info: ConnInfo = {
        localAddr,
        alpnProtocol: undefined,
        remoteAddr,
    };
    const httpConn = Deno.serveHttp(conn);
    signal?.addEventListener("abort", function () {
        httpConn.close();
        conn.close();
    });

    for await (const requestEvent of httpConn) {
        if (signal?.aborted) {
            return;
        }

        const promise = requestEventProcessor({
            handlers,
            requestEvent,
            conn_info,
            onError,
            onNotFound,
        }).catch(console.error);
        if (is_connect_or_upgrade(requestEvent.request)) {
            return await promise;
        }
    }
}
function is_connect_or_upgrade(request: Request) {
    return (
        request.method === "CONNECT" ||
        request.headers.get("Connection")?.toLowerCase() === "upgrade"
    );
}
async function requestEventProcessor({
    handlers,
    requestEvent,
    conn_info,
    onError = on_Error,
    onNotFound = on_NotFound,
}: {
    handlers: Partial<{ request: Handler; connect: Handler; upgrade: Handler }>;
    requestEvent: Deno.RequestEvent;
    conn_info: ConnInfo;
    onError?: (
        // deno-lint-ignore no-explicit-any
        reason: any,
        request: Request,
        connInfo: ConnInfo,
    ) => Response | PromiseLike<Response>;
    onNotFound?: Handler;
}) {
    if (handlers.connect) {
        if (requestEvent.request.method === "CONNECT") {
            await on_request({
                requestEvent,
                connInfo: conn_info,
                handler: handlers.connect,
                onError,
            }).catch(console.error);
            return;
        }
    }
    if (handlers.upgrade) {
        if (
            requestEvent.request.headers.get("Connection")?.toLowerCase() ===
                "upgrade"
        ) {
            await on_request({
                requestEvent,
                connInfo: conn_info,
                handler: handlers.upgrade,
                onError,
            }).catch(console.error);
            return;
        }
    }
    if (handlers.request && !is_connect_or_upgrade(requestEvent.request)) {
        await on_request({
            requestEvent,
            connInfo: conn_info,
            handler: handlers.request,
            onError,
        }).catch(console.error);
        return;
    }
    await on_request({
        requestEvent,
        connInfo: conn_info,
        handler: onNotFound,
        onError,
    }).catch(console.error);
    return;
}
export function on_Error(
    // deno-lint-ignore no-explicit-any
    e: any,
) {
    console.error(e);
    return new Response(String(e), {
        status: 500,
    });
}
async function on_request({
    requestEvent,
    connInfo,
    handler,
    onError = on_Error,
}: {
    requestEvent: Deno.RequestEvent;
    connInfo: ConnInfo;
    handler: (req: Request, connInfo: ConnInfo) => Response | Promise<Response>;
    onError?: (
        // deno-lint-ignore no-explicit-any
        reason: any,
        request: Request,
        connInfo: ConnInfo,
    ) => Response | PromiseLike<Response>;
}) {
    await requestEvent.respondWith(
        await Promise.resolve(handler(requestEvent.request, connInfo)).catch(
            (e) => onError(e, requestEvent.request, connInfo),
        ),
    );
}
