const { isArray } = Array;
const { keys, freeze, create } = Object;
const { hasOwnProperty } = Object.prototype;
const { stringify } = JSON;

export {
    // Array
    isArray as ArrayIsArray,
    // Object
    keys as ObjectKeys,
    freeze as ObjectFreeze,
    create as ObjectCreate,
    // Object.prototype
    hasOwnProperty as ObjectPrototypeHasOwnProperty,
    // JSON
    stringify as JSONStringify,
};
