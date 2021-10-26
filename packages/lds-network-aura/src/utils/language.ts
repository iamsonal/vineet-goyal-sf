const { push, join } = Array.prototype;
const { isArray } = Array;
const { create, entries, keys } = Object;
const { parse, stringify } = JSON;

export {
    // Array.prototype
    push as ArrayPrototypePush,
    join as ArrayPrototypeJoin,
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
