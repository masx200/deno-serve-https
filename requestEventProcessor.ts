import { ConnInfo } from "./ConnInfo.ts";
import { Handler } from "./Handler.ts";
import { is_connect_or_upgrade } from "./is_connect_or_upgrade.ts";
import { on_Error } from "./on_Error.ts";
import { on_NotFound } from "./on_NotFound.ts";
import { on_request } from "./on_request.ts";

export async function requestEventProcessor({
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
const{alpnProtocol}=conn_info
    if (handlers.connect&&alpnProtocol !== "h2" ) {
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
    if (handlers.upgrade&&alpnProtocol !== "h2" ) {
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
    if (handlers.request &&(alpnProtocol === "h2"|| !is_connect_or_upgrade(requestEvent.request))) {
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
