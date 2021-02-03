const { keys, create, assign } = Object;
const { stringify, parse } = JSON;
const { isArray } = Array;

export {
    // Object
    keys as ObjectKeys,
    create as ObjectCreate,
    assign as ObjectAssign,
    // Array
    isArray as ArrayIsArray,
    // JSON
    stringify as JSONStringify,
    parse as JSONParse,
};
