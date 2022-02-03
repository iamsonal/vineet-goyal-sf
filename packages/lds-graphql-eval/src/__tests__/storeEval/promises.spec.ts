import type { SqlStore } from '@salesforce/lds-store-sql';

import { updateIndices, durableObjectInfo, queryTableAttrs } from '../../storeEval/promises';
import { indicesSql, objectInfoSql, SqlMappingInput, tableAttrs } from '../../ast-to-sql';
import { TABLE_ATTRS_DB_RESULT, TABLE_ATTRS_JSON } from './util';

function setup(evalResult: string) {
    const store: SqlStore = {
        isEvalSupported: () => true,

        updateIndices: jest.fn(() => new Promise((resolve) => setTimeout(() => resolve()))),

        evaluateSQL: jest.fn(
            () => new Promise<string>((resolve) => setTimeout(() => resolve(evalResult)))
        ),
    };

    return { store };
}

const mappingInput: SqlMappingInput = {
    jsonColumn: 'jsonColumn',
    keyColumn: 'keyColumn',
    jsonTable: 'jsonTable',
};

describe('promises', () => {
    describe('getDurableObjectInfo', () => {
        it('rejects if mapping input is not available', () => {
            expect.assertions(1);
            const { store } = setup('{}');
            const tableAttrs = (_: SqlStore) => Promise.resolve(undefined);

            const { query: promise } = durableObjectInfo(tableAttrs);

            return promise(store).catch((e) => {
                expect(e).toEqual('Undefined table attributes.');
            });
        });

        it('shares promise if one is already pending', async () => {
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const tableAttrs = (_: SqlStore) => Promise.resolve(mappingInput);
            const { query: promise } = durableObjectInfo(tableAttrs);

            await Promise.all([
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
            ]);

            expect(store.evaluateSQL).toHaveBeenCalledTimes(1);
        });

        it('evaluates query if mapping input is available', async () => {
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const tableAttrs = (_: SqlStore) => Promise.resolve(mappingInput);
            const { query: promise } = durableObjectInfo(tableAttrs);

            await promise(store);

            expect(store.evaluateSQL).toHaveBeenNthCalledWith(1, objectInfoSql(mappingInput), []);
        });

        it('allows new requests after finishing', async () => {
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const tableAttrs = (_: SqlStore) => Promise.resolve(mappingInput);
            const { query: promise } = durableObjectInfo(tableAttrs);

            await Promise.all([
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
            ]);

            await Promise.all([
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
            ]);

            expect(store.evaluateSQL).toHaveBeenCalledTimes(2);
        });
    });

    describe('getTableAttrs', () => {
        it('calls evaluateSQL', async () => {
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const promise = queryTableAttrs();
            const result = await promise(store);

            expect(result).toEqual(TABLE_ATTRS_JSON);
            expect(store.evaluateSQL).toHaveBeenCalledTimes(1);
            expect(store.evaluateSQL).toHaveBeenNthCalledWith(1, tableAttrs, []);
        });

        it('rejects if table attributes are missing LdsSoupValue', async () => {
            const { store } = setup('{}');
            const promise = queryTableAttrs();
            const result = await promise(store);

            expect(result).toEqual(undefined);
        });

        it('rejects if table attributes are missing LdsSoupTable', async () => {
            const { store } = setup('{"LdsSoupValue": "x"}');
            const promise = queryTableAttrs();
            const result = await promise(store);

            expect(result).toEqual(undefined);
        });

        it('rejects if table attributes are missing LdsSoupKey', async () => {
            const { store } = setup('{"LdsSoupValue": "x", "LdsSoupTable": "y" }');
            const promise = queryTableAttrs();
            const result = await promise(store);

            expect(result).toEqual(undefined);
        });
        it('shares promise if one is already pending', async () => {
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const promise = queryTableAttrs();

            await Promise.all([
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
            ]);

            expect(store.evaluateSQL).toHaveBeenCalledTimes(1);
        });

        it('allows new requests if rejected', async () => {
            const { store: badStore } = setup('{}');
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const promise = queryTableAttrs();

            await promise(badStore);

            await Promise.all([
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
            ]);

            expect(badStore.evaluateSQL).toHaveBeenCalledTimes(1);
            expect(store.evaluateSQL).toHaveBeenCalledTimes(1);
        });
    });

    describe('applyIndices', () => {
        it('rejects if mapping input is not available', () => {
            const { store } = setup('{}');
            const tableAttrs = queryTableAttrs();
            const promise = updateIndices(tableAttrs);

            return promise(store).catch((e) => {
                expect(e).toEqual('Undefined table attributes.');
            });
        });

        it('calls updateIndices if mapping input is available', async () => {
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const tableAttrs = queryTableAttrs();
            const promise = updateIndices(tableAttrs);

            await promise(store);

            expect(store.evaluateSQL).toHaveBeenCalledTimes(1);
            expect(store.updateIndices).toHaveBeenNthCalledWith(1, indicesSql(TABLE_ATTRS_JSON));
        });

        it('shares promise if one is already pending', async () => {
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const tableAttrs = queryTableAttrs();
            const promise = updateIndices(tableAttrs);

            await Promise.all([
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
                promise(store),
            ]);

            expect(store.evaluateSQL).toHaveBeenCalledTimes(1);
            expect(store.updateIndices).toHaveBeenCalledTimes(1);
        });

        it('allows new requests if rejected', async () => {
            const { store: badStore } = setup('{}');
            const { store } = setup(TABLE_ATTRS_DB_RESULT);
            const tableAttrs = queryTableAttrs();
            const promise = updateIndices(tableAttrs);

            await promise(badStore);

            await Promise.all([promise(store), promise(store), promise(store)]);

            expect(badStore.evaluateSQL).toHaveBeenCalledTimes(1);
            expect(store.evaluateSQL).toHaveBeenCalledTimes(1);
            expect(store.updateIndices).toHaveBeenCalledTimes(1);
        });
    });
});
