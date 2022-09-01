import { ConnInfo } from "./ConnInfo.ts";

export type Handler = (
    request: Request,
    connInfo: ConnInfo,
) => Response | Promise<Response>;
