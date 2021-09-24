const { parse, stringify } = JSON;
const { join, push, unshift } = Array.prototype;
const { isArray } = Array;
const { entries, keys } = Object;

export {
    isArray as ArrayIsArray,
    entries as ObjectEntries,
    keys as ObjectKeys,
    parse as JSONParse,
    stringify as JSONStringify,
    join as ArrayPrototypeJoin,
    push as ArrayPrototypePush,
    unshift as ArrayPrototypeUnshift,
};
