const { isArray } = Array;
const { keys, freeze } = Object;
const { hasOwnProperty } = Object.prototype;
const { stringify } = JSON;

export {
    // Array
    isArray as ArrayIsArray,
    // Object
    keys as ObjectKeys,
    freeze as ObjectFreeze,
    // Object.prototype
    hasOwnProperty as ObjectPrototypeHasOwnProperty,
    // JSON
    stringify as JSONStringify,
};
