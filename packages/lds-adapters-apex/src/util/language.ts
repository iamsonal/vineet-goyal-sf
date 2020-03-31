const { keys, values } = Object;
const { hasOwnProperty } = Object.prototype;
const { isArray } = Array;
const { stringify } = JSON;

export {
    // Object
    keys as ObjectKeys,
    values as ObjectValues,
    hasOwnProperty as ObjectPrototypeHasOwnProperty,
    // Array
    isArray as ArrayIsArray,
    // JSON
    stringify as JSONStringify,
};
