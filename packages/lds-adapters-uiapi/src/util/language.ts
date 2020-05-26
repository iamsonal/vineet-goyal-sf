const { assign, create, freeze, keys } = Object;
const { hasOwnProperty } = Object.prototype;

const { split, endsWith } = String.prototype;

const { isArray } = Array;
const { concat, push, reduce } = Array.prototype;

const { parse, stringify } = JSON;

export {
    // Object
    assign as ObjectAssign,
    create as ObjectCreate,
    freeze as ObjectFreeze,
    keys as ObjectKeys,
    // Object.prototype
    hasOwnProperty as ObjectPrototypeHasOwnProperty,
    // Array
    isArray as ArrayIsArray,
    // Array.prototype
    concat as ArrayPrototypeConcat,
    push as ArrayPrototypePush,
    reduce as ArrayPrototypeReduce,
    // String.prototype
    split as StringPrototypeSplit,
    endsWith as StringPrototypeEndsWith,
    // JSON
    parse as JSONParse,
    stringify as JSONStringify,
};
