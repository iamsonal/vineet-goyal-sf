export function counter() {
    return {
        increment() {},
        decrement() {},
        getValue() {},
        reset() {},
    };
}
export function gauge() {
    return {
        setValue() {},
        getValue() {},
        reset() {},
    };
}
export function mark() {}
export function markStart() {}
export function markEnd() {}
export function perfStart() {}
export function perfEnd() {}
export function percentileHistogram() {
    return {
        update() {},
        getValue() {},
        reset() {},
    };
}
export function time() {}
export function timer() {
    return {
        addDuration() {},
        getValue() {},
        time() {},
    };
}
export function registerCacheStats() {
    return {
        logHits() {},
        logMisses() {},
    };
}
export function registerPlugin() {}
export function registerPeriodicLogger() {}
