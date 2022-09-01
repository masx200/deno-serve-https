import { assert } from "https://deno.land/std@0.153.0/_util/assert.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";

import { handlers } from "./example.ts";
import { serve_http } from "./mod.ts";

Deno.test("example-request", async () => {
    const ac = new AbortController();
    const { signal } = ac;
    await new Promise<void>((res) => {
        serve_http(handlers, {
            port: 18080,
            signal,
            onListen({ hostname, port }) {
                console.log("listening", { hostname, port });
                res();
            },
        });
    });

    const res = await fetch("http://localhost:18080/15487354", {});
    assert(res.ok);
    const json = await res.json();
    assert(json?.url === "http://localhost:18080/15487354");
    assert(json?.method === "GET");
    ac.abort();
});
Deno.test("example-upgrade", async () => {
    const ac = new AbortController();
    const { signal } = ac;
    await new Promise<void>((res) => {
        serve_http(handlers, {
            port: 18081,
            signal,
            onListen({ hostname, port }) {
                console.log("listening", { hostname, port });
                res();
            },
        });
    });
    const wss = new WebSocketStream("ws://localhost:18081/15487354");
    const conn = await wss.connection;
    const { readable } = conn;
    const reader = readable.getReader();
    const data: Array<string> = [];
    while (true) {
        const result = await reader.read();
        if (result.done) break;
        data.push(result.value as string);
    }
    const json = JSON.parse(data.join(""));

    assertEquals(json?.url, "http://localhost:18081/15487354");
    assert(json?.method === "GET");
    wss.close();
    ac.abort();
});
