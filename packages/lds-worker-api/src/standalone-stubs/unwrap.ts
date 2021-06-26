export function unwrap<T>(data: T): T {
    // The lwc-luvio bindings import a function from lwc called "unwrap".
    // The problem is by bringing that version of unwrap in it also brings
    // in a bunch of other LWC stuff that calls DOM apis.  JSContext can't
    // handle that so for now we just fake in our own version of unwrap
    // that does nothing but returns the same data.
    return data;
}
