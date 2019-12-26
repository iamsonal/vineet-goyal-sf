const { freeze, keys } = Object;
const { hasOwnProperty } = Object.prototype;

const { split, endsWith } = String.prototype;

const { isArray } = Array;
const { push } = Array.prototype;

const { parse, stringify } = JSON;

export {
    // Object
    freeze as ObjectFreeze,
    keys as ObjectKeys,
    // Object.prototype
    hasOwnProperty as ObjectPrototypeHasOwnProperty,
    // Array
    isArray as ArrayIsArray,
    // Array.prototype
    push as ArrayPrototypePush,
    // String.prototype
    split as StringPrototypeSplit,
    endsWith as StringPrototypeEndsWith,
    // JSON
    parse as JSONParse,
    stringify as JSONStringify,
};
