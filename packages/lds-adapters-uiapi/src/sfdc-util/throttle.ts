interface ThrottleOptions {
    allowFunction: Function;
    dropFunction: Function;
}

/**
 * Limit the frequency and the duration that a function is invoked.
 *
 * @param invokeLimit The frequency a function could be invoked.
 * @param timeLimit The duration a function could be invoked with the rate limit, in milliseconds.
 * @param fn The function to be invoked.
 * @param options Extra options for instrumentation, logging, or bookkeeping purposes.
 * @returns The wrapped rate limited function.
 */
export function throttle<T extends any[], R extends any>(
    invokeLimit: number,
    timeLimit: number,
    fn: (...args: T) => R,
    options?: ThrottleOptions
): (...args: T) => R | void {
    if (invokeLimit <= 0 || timeLimit <= 0) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error('only supports throttling with positive invokeLimit and timeLimit');
        }
    }

    let invokeCount = 0;
    let time = Date.now();
    const allowFunction = options && options.allowFunction ? options.allowFunction : () => {};
    const dropFunction = options && options.dropFunction ? options.dropFunction : () => {};
    return (...args: T) => {
        const calledTime = Date.now();
        if (calledTime - time <= timeLimit) {
            if (invokeCount < invokeLimit) {
                invokeCount += 1;
                allowFunction();
                return fn(...args);
            } else {
                dropFunction();
            }
        } else {
            time = calledTime;
            invokeCount = 1;
            allowFunction();
            return fn(...args);
        }
    };
}
