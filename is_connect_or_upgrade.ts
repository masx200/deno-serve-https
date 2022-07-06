export function is_connect_or_upgrade(request: Request) {
    return (
        request.method === "CONNECT" ||
        request.headers.get("Connection")?.toLowerCase() === "upgrade"
    );
}
