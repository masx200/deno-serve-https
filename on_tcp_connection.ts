import { ConnInfo } from "./ConnInfo.ts";
import { Handler } from "./Handler.ts";
import { Handlers } from "./Handlers.ts";
import { is_connect_or_upgrade } from "./is_connect_or_upgrade.ts";
import { on_Error } from "./on_Error.ts";
import { on_NotFound } from "./on_NotFound.ts";
import { requestEventProcessor } from "./requestEventProcessor.ts";

export async function on_tcp_connection({
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
        alpnProtocol: null,
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
