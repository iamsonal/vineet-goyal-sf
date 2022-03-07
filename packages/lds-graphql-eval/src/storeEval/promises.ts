import type { SqlStore } from '@salesforce/lds-store-sql';
import type { SqlMappingInput } from '../ast-to-sql';
import { indicesSql, objectInfoSql, tableAttrsSql } from '../ast-to-sql';
import type { ObjectInfoMap } from '../info-types';

type GetTableAttrs = (sqlStore: SqlStore) => Promise<SqlMappingInput | undefined>;

/**
 * Returns a promise function that queries all available object info from the durable store.
 * The shape of the object info will only contain the field and relationship
 * properties needed for offline eval.
 *
 * The function only allows one promise to run at a time. Requests that are made while
 * the promise resolves will share the result of the running promise.
 *
 * When the promise completes a new promise can be attempted
 */
export function durableObjectInfo(getTableAttrs: GetTableAttrs): {
    query: (sqlStore: SqlStore) => Promise<ObjectInfoMap | undefined>;
    saved: () => ObjectInfoMap | undefined;
} {
    let getDurableObjectInfoPromise: Promise<ObjectInfoMap | undefined> | undefined = undefined;
    let lastObjectInfoMap: ObjectInfoMap | undefined = undefined;

    //creates work
    const query = (sqlStore: SqlStore) => {
        if (getDurableObjectInfoPromise === undefined) {
            getDurableObjectInfoPromise = getTableAttrs(sqlStore)
                .then((mappingInput) => {
                    if (mappingInput === undefined) {
                        return Promise.resolve(undefined);
                    }

                    const sql = objectInfoSql(mappingInput);

                    return sqlStore.evaluateSQL(sql, []).then(JSON.parse);
                })
                .then((info) => {
                    if (info !== undefined) {
                        lastObjectInfoMap = info;
                    }
                    return info;
                })
                .catch(() => {})
                .finally(() => {
                    //clear the promise so it can be run again
                    getDurableObjectInfoPromise = undefined;
                });
        }

        return getDurableObjectInfoPromise;
    };

    //does not create work
    const saved = () => lastObjectInfoMap;

    return { query, saved };
}

/**
 * Returns a promise function that queries the smart store attributes for the DEFAULT
 * segment.  These attributes are used to create graphql sql queries.
 *
 * The function only allows one promise to run at a time. Requests that are made while
 * the promise resolves will share the result of the running promise.
 *
 * If the promise completes successfully subsequent requests will share the resolved value.
 * If the promise fails, a new promise can be attempted.
 */
export function queryTableAttrs(): GetTableAttrs {
    let tableAttrsPromise: Promise<SqlMappingInput | undefined> | undefined = undefined;

    return (sqlStore: SqlStore) => {
        if (tableAttrsPromise === undefined) {
            tableAttrsPromise = sqlStore
                .evaluateSQL(tableAttrsSql, [])
                .then((result) => {
                    const attrs = JSON.parse(result);
                    const jsonColumn = attrs['LdsSoupValue'];
                    if (jsonColumn === undefined || typeof jsonColumn !== 'string') {
                        return Promise.reject('Missing LdsSoupValue');
                    }
                    const jsonTable = attrs['LdsSoupTable'];
                    if (jsonTable === undefined || typeof jsonTable !== 'string') {
                        return Promise.reject('Missing LdsSoupTable');
                    }

                    const keyColumn = attrs['LdsSoupKey'];
                    if (keyColumn === undefined || typeof keyColumn !== 'string') {
                        return Promise.reject('Missing LdsSoupKey');
                    }

                    const output: SqlMappingInput = { jsonColumn, jsonTable, keyColumn };
                    return output;
                })
                .catch((_error) => {
                    //clear the promise so it can be re-tried
                    tableAttrsPromise = undefined;
                    return undefined;
                });
        }

        return tableAttrsPromise;
    };
}

/**
 * Returns a promise function that applies sql indices for graphql to the durable store.
 *
 * The function only allows one promise to run at a time. Requests that are made while
 * the promise resolves will share the result of the running promise.
 *
 * If the promise completes successfully subsequent requests will share that resolved value.
 * If the promise fails, a new promise can be attempted.
 */
export function updateIndices(getTableAttrs: GetTableAttrs): (sqlStore: SqlStore) => Promise<void> {
    let applyIndicesPromise: Promise<void> | undefined = undefined;

    return (sqlStore: SqlStore) => {
        if (applyIndicesPromise === undefined) {
            applyIndicesPromise = getTableAttrs(sqlStore)
                .then((mappingInput) => {
                    if (mappingInput === undefined) {
                        return Promise.reject('Undefined table attributes.');
                    }

                    const indices = indicesSql(mappingInput);
                    return sqlStore.updateIndices(indices);
                })
                .catch((_) => {
                    //clear the promise so it can be re-tried
                    applyIndicesPromise = undefined;
                });
        }

        return applyIndicesPromise;
    };
}
