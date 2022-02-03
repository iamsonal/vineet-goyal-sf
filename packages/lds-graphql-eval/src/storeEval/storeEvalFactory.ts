import type { Snapshot, TTLStrategy } from '@luvio/engine';
import type { DurableStoreChange } from '@luvio/environments';
import type { LuvioDocumentNode } from '@luvio/graphql-parser';
import type { SqlStore, SqlDurableStore } from '@salesforce/lds-store-sql';

import { transform } from '../ast-parser';
import { sql, SqlMappingInput } from '../ast-to-sql';
import { message, PredicateError } from '../Error';
import { failure, Result } from '../Result';
import { queryTableAttrs, durableObjectInfo, updateIndices } from './promises';
import { ObjectInfoMap } from '../info-types';
import { RootQuery } from '../Predicate';
import { hasObjectInfoChanges } from './util';
import { createSnapshot } from './snapshot';

function evalQuery(
    ast: LuvioDocumentNode,
    userId: string,
    objectInfoMap: ObjectInfoMap | undefined
): Result<RootQuery, PredicateError[]> {
    if (objectInfoMap !== undefined) {
        return transform(ast, { userId, objectInfoMap });
    }

    return failure([message('Missing object info cache.')]);
}

function offlineEvalSnapshot(
    query: RootQuery,
    mappingInput: SqlMappingInput,
    sqlStore: SqlStore,
    ttlStrategy: TTLStrategy,
    timestamp: number
): Promise<Snapshot<unknown, any>> {
    const { sql: sqlString, bindings } = sql(query, mappingInput);

    return sqlStore.evaluateSQL(sqlString, bindings).then((result) => {
        const json = JSON.parse(result);
        const snapshot = createSnapshot(json, ttlStrategy, timestamp);

        return snapshot;
    });
}

type StoreEval = (
    ast: LuvioDocumentNode,
    ttlStrategy: TTLStrategy
) => Promise<Snapshot<unknown, any>>;

export function storeEvalFactory(
    userId: string,
    sqlDurableStore: SqlDurableStore,
    timestampSource: () => number = Date.now
): StoreEval {
    const tableAttrsPromise = queryTableAttrs();
    const { query: queryObjectInfo, saved: savedObjectInfo } = durableObjectInfo(tableAttrsPromise);
    const applyIndicesPromise = updateIndices(tableAttrsPromise);

    queryObjectInfo(sqlDurableStore);

    sqlDurableStore.registerOnChangedListener((changes: DurableStoreChange[]) => {
        if (sqlDurableStore.isEvalSupported() === false) {
            return;
        }

        applyIndicesPromise(sqlDurableStore);

        if (hasObjectInfoChanges(changes) === true) {
            queryObjectInfo(sqlDurableStore);
        }
    });

    const makeEvalQuery = (ast: LuvioDocumentNode) => {
        const objectInfoMap = savedObjectInfo();
        return evalQuery(ast, userId, objectInfoMap);
    };

    const storeEval = (ast: LuvioDocumentNode, ttlStrategy: TTLStrategy) => {
        if (sqlDurableStore.isEvalSupported() === false) {
            // console.log('eval not supported')
            return Promise.reject('Eval is not supported.');
        }

        const queryResult = makeEvalQuery(ast);
        if (queryResult.isSuccess === false) {
            return Promise.reject(
                `Could not map GraphQL AST to SQL: ${JSON.stringify(queryResult.error)}`
            );
        }

        return tableAttrsPromise(sqlDurableStore).then((mappingInput) => {
            if (mappingInput === undefined) {
                return Promise.reject('DurableStore attrs required for evaluating GraphQL query.');
            }

            const timestamp = timestampSource();
            return offlineEvalSnapshot(
                queryResult.value,
                mappingInput,
                sqlDurableStore,
                ttlStrategy,
                timestamp
            );
        });
    };

    return storeEval;
}
