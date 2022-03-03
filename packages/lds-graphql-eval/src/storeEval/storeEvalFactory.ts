import type { Snapshot, TTLStrategy } from '@luvio/engine';
import type { DurableStoreChange } from '@luvio/environments';
import type { LuvioDocumentNode } from '@luvio/graphql-parser';
import type { SqlStore, SqlDurableStore } from '@salesforce/lds-store-sql';

import { MetricsReporter } from '@salesforce/lds-instrumentation';
import { transform } from '../ast-parser';
import type { SqlMappingInput } from '../ast-to-sql';
import { sql } from '../ast-to-sql';
import type { PredicateError } from '../Error';
import { message } from '../Error';
import type { Result } from '../Result';
import { failure } from '../Result';
import { queryTableAttrs, durableObjectInfo, updateIndices } from './promises';
import type { ObjectInfoMap } from '../info-types';
import type { RootQuery } from '../Predicate';
import { hasObjectInfoChanges } from './util';
import { createSnapshot } from './snapshot';

// TODO [W-10791579]: See if we can inject this into storeEvalFactory
const metricsReporter = new MetricsReporter();

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

    return sqlStore
        .evaluateSQL(sqlString, bindings)
        .then((result) => {
            const json = JSON.parse(result);
            const snapshot = createSnapshot(json, ttlStrategy, timestamp);

            return snapshot;
        })
        .catch((err) => {
            metricsReporter.reportGraphqlCreateSnapshotError(err);

            throw err;
        });
}

export type StoreEval = (
    ast: LuvioDocumentNode,
    ttlStrategy: TTLStrategy
) => Promise<Snapshot<unknown, any>>;

const wrapInstrumentation = (storeEval: StoreEval): StoreEval => {
    return (ast: LuvioDocumentNode, ttlStrategy: TTLStrategy) => {
        return storeEval(ast, ttlStrategy).then((snapshot) => {
            metricsReporter.reportGraphqlAdapterSuccess();

            return snapshot;
        });
    };
};

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
            const error = new Error('Eval is not supported.');
            metricsReporter.reportGraphqlSqlEvalPreconditionError(error);

            return Promise.reject(error);
        }

        const queryResult = makeEvalQuery(ast);
        if (queryResult.isSuccess === false) {
            const error = new Error(
                `Could not map GraphQL AST to SQL: ${JSON.stringify(queryResult.error)}`
            );
            metricsReporter.reportGraphqlSqlEvalPreconditionError(error);

            return Promise.reject(error);
        }

        return tableAttrsPromise(sqlDurableStore).then((mappingInput) => {
            if (mappingInput === undefined) {
                const error = new Error(
                    'DurableStore attrs required for evaluating GraphQL query.'
                );
                metricsReporter.reportGraphqlSqlEvalPreconditionError(error);

                return Promise.reject(error);
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

    return wrapInstrumentation(storeEval);
}
