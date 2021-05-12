export default function merge<T extends Record<string, unknown>>(
    existing: T | undefined,
    incoming: T
) {
    if (existing === undefined) {
        return incoming;
    }

    // Merge existing and incoming values together
    return {
        ...existing,
        ...incoming,
    };
}
