const { push, join, unshift, filter } = Array.prototype;
const { isArray } = Array;
const { create, entries, keys } = Object;
const { parse, stringify } = JSON;

export {
    // Array.prototype
    push as ArrayPrototypePush,
    join as ArrayPrototypeJoin,
    unshift as ArrayPrototypeUnshift,
    filter as ArrayPrototypeFilter,
    // Array
    isArray as ArrayIsArray,
    // Object
    create as ObjectCreate,
    entries as ObjectEntries,
    keys as ObjectKeys,
    // JSON
    parse as JSONParse,
    stringify as JSONStringify,
};
