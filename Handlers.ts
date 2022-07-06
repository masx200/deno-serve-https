import { Handler } from "./Handler.ts";

export type Handlers = Partial<{
    request: Handler;
    connect: Handler;
    upgrade: Handler;
}>;
