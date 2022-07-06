import { ConnInfo } from "./ConnInfo.ts";
import { on_Error } from "./on_Error.ts";

export async function on_request({
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
