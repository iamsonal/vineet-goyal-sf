const { keys, create, assign } = Object;
const { stringify, parse } = JSON;
const { push, join } = Array.prototype;
const { isArray } = Array;

export {
    // Object
    keys as ObjectKeys,
    create as ObjectCreate,
    assign as ObjectAssign,
    // Array.prototype
    push as ArrayPrototypePush,
    join as ArrayPrototypeJoin,
    // Array
    isArray as ArrayIsArray,
    // JSON
    stringify as JSONStringify,
    parse as JSONParse,
};
