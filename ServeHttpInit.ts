import { ConnInfo } from "./ConnInfo.ts";
import { Handler } from "./Handler.ts";

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
