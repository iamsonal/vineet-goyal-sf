const { keys, create, assign, entries } = Object;
const { stringify, parse } = JSON;
const { push, join } = Array.prototype;
const { isArray, from } = Array;

export {
    // Object
    keys as ObjectKeys,
    create as ObjectCreate,
    assign as ObjectAssign,
    entries as ObjectEntries,
    // Array.prototype
    push as ArrayPrototypePush,
    join as ArrayPrototypeJoin,
    // Array
    isArray as ArrayIsArray,
    from as ArrayFrom,
    // JSON
    stringify as JSONStringify,
    parse as JSONParse,
};
