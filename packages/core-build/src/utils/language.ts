const { push, reduce, join } = Array.prototype;
const { create, entries, keys } = Object;
const { hasOwnProperty } = Object.prototype;
const { parse, stringify } = JSON;
const { isArray } = Array;

export {
    // Array.prototype
    push as ArrayPrototypePush,
    reduce as ArrayPrototypeReduce,
    join as ArrayPrototypeJoin,
    // Array
    isArray as ArrayIsArray,
    // Object
    create as ObjectCreate,
    entries as ObjectEntries,
    keys as ObjectKeys,
    // Object.prototype
    hasOwnProperty as ObjectPrototypeHasOwnProperty,
    // JSON
    parse as JSONParse,
    stringify as JSONStringify,
};
