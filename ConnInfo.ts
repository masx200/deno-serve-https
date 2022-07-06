export type ConnInfo = Readonly<{
    /** The local address of the connection. */
    readonly localAddr: Deno.Addr;
    /** The remote address of the connection. */
    readonly remoteAddr: Deno.Addr;
    alpnProtocol: string | null;
}>;
