const { push } = Array.prototype;
const { keys } = Object;
const { hasOwnProperty } = Object.prototype;
const { parse, stringify } = JSON;

export {
    // Array.prototype
    push as ArrayPrototypePush,
    // Object
    keys as ObjectKeys,
    // Object.prototype
    hasOwnProperty as ObjectPrototypeHasOwnProperty,
    // JSON
    parse as JSONParse,
    stringify as JSONStringify,
};
