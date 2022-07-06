export function on_Error(
    // deno-lint-ignore no-explicit-any
    e: any,
) {
    console.error(e);
    return new Response(String(e), {
        status: 500,
    });
}
