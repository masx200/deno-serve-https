import { ConnInfo } from "./ConnInfo.ts";
import { Handler } from "./Handler.ts";
import { Handlers } from "./Handlers.ts";
import { ServeHttpInit } from "./ServeHttpInit.ts";
import { ServeHttpsInit } from "./ServeHttpsInit.ts";
import { serve_http } from "./serve_http.ts";
import { serve_https } from "./serve_https.ts";

export { serve_http, serve_https };
export type { ServeHttpInit };
export type { ConnInfo, Handler, Handlers, ServeHttpsInit };
// import { serve } from "https://deno.land/std@0.147.0/http/server.ts";
// import { handler } from "https://deno.land/x/masx200_hello_world_deno_deploy@1.1.5/mod.ts";
// import { parse } from "https://deno.land/std@0.147.0/flags/mod.ts";
// if (import.meta.main) {
//     await main();
