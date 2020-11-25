const { keys, create, assign } = Object;
const { stringify, parse } = JSON;
const { shift } = Array.prototype;
const { isArray } = Array;
export {
    // Object
    keys as ObjectKeys,
    create as ObjectCreate,
    assign as ObjectAssign,
    // JSON
    stringify as JSONStringify,
    parse as JSONParse,
    // Array
    shift as ArrayPrototypeShift,
    isArray as ArrayIsArray,
};
