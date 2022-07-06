export function on_NotFound() {
    return new Response("Not Found", {
        status: 404,
    });
}
