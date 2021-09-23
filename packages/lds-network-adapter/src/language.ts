const { parse, stringify } = JSON;
const { join, push, unshift } = Array.prototype;
const { entries, keys } = Object;

export {
    entries as ObjectEntries,
    keys as ObjectKeys,
    parse as JSONParse,
    stringify as JSONStringify,
    join as ArrayPrototypeJoin,
    push as ArrayPrototypePush,
    unshift as ArrayPrototypeUnshift,
};
