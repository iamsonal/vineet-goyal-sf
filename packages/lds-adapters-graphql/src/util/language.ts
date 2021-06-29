const { isArray } = Array;
const { keys, freeze } = Object;

export {
    // Array
    isArray as ArrayIsArray,
    //Object
    keys as ObjectKeys,
    freeze as ObjectFreeze,
};

export function untrustedIsObject<Base>(untrusted: unknown): untrusted is Untrusted<Base> {
    return typeof untrusted === 'object' && untrusted !== null && isArray(untrusted) === false;
}

export type Untrusted<Base> = Partial<Base>;
