import { ConnInfo, serve_http, serve_https } from "./mod.ts";
export function upgrade(req: Request, connInfo: ConnInfo) {
    const { socket, response } = Deno.upgradeWebSocket(req);
    const { url, headers, method } = req;
    const data = {
        ...connInfo,
        url,
        method,
        headers: Object.fromEntries(headers),
    };

    const body = JSON.stringify(data);
    console.log("upgrade", body);
    socket.addEventListener("open", () => {
        socket.send(body);
        socket.close();
    });
    return response;
}
export { handler as request };
function handler(req: Request, connInfo: ConnInfo): Response {
    const { url, headers, method } = req;

    const data = {
        ...connInfo,
        url,
        method,
        headers: Object.fromEntries(headers),
    };

    const body = JSON.stringify(data);
    console.log("request", body);
    return new Response(body, {
        headers: { "content-type": "application/json" },
    });
}
export async function connect(
    request: Request,
    connInfo: ConnInfo,
): Promise<Response> {
    const { url, headers, method } = request;

    const data = {
        ...connInfo,
        url,
        method,
        headers: Object.fromEntries(headers),
    };

    const body = JSON.stringify(data);
    console.log("connect", body);
    const req = request;
    const { port, hostname } = new URL(req.url);

    const connect_port = port ? Number(port) : 80;
    try {
        const socket: Deno.TcpConn = await Deno.connect({
            port: connect_port,
            hostname,
        });
        Deno.upgradeHttp(request).then(async ([conn, firstPacket]) => {
            try {
                await writeAll(conn, firstPacket);
                await Promise.race([copy(conn, socket), copy(socket, conn)]);
            } catch (error) {
                console.error(error);
            } finally {
                socket.close();
                conn.close();
            }
        });
        return new Response(null, { status: 200 });
    } catch (e) {
        console.error(String(e));
        return new Response("503", { status: 503 });
    }
}
export const handlers = { upgrade, connect, request: handler };

import {
    copy,
    writeAll,
} from "https://deno.land/std@0.146.0/streams/conversion.ts";
export const key = await (
    await fetch("https://unpkg.com/self-signed-cert@1.0.1/key.pem")
).text();
export const cert = await (
    await fetch("https://unpkg.com/self-signed-cert@1.0.1/cert.pem")
).text();
console.log(cert, key);
serve_http(handlers, { port: 18080 });
serve_https(handlers, { port: 18443, cert, key });
