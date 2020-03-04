export function markStart() {
    return { perfKey: 'mock', perfContext: {} };
}

export function markEnd() {}

export function instrumentError() {}

export function time() {
    return 0;
}

export function perfStart() {}

export function perfEnd() {}

export function registerCacheStats() {
    return {
        logMisses() {},
        logHits() {},
    };
}

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

export function percentileHistogram() {
    return {
        update() {},
        getValue() {},
        reset() {},
    };
}

export function timer() {
    return {
        addDuration() {},
    };
}
