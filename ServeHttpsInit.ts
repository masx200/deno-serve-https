import { ConnInfo } from "./ConnInfo.ts";
import { Handler } from "./Handler.ts";

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
