import type { Snapshot } from '@luvio/engine';
import type { DurableStoreChange } from '@luvio/environments';
import type { LuvioDocumentNode } from '@luvio/graphql-parser';
import type { SqlStore, SqlDurableStore } from '@salesforce/lds-store-sql';
import type { SqlMappingInput } from '../ast-to-sql';
import type { PredicateError } from '../Error';
import type { Result } from '../Result';
import type { ObjectInfoMap } from '../info-types';
import type { RootQuery } from '../Predicate';

import { MetricsReporter } from '@salesforce/lds-instrumentation';
import { transform } from '../ast-parser';
import { sql } from '../ast-to-sql';
import { message } from '../Error';
import { failure } from '../Result';
import { queryTableAttrs, durableObjectInfo, updateIndices } from './promises';
import { hasObjectInfoChanges, isPromise } from './util';
import { createFulfilledSnapshot, createSeenRecords } from './snapshot';

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

type DataAndSeenRecords<D> = { data: D; seenRecords: Record<string, true> };

function evalSql<D>(
    query: RootQuery,
    mappingInput: SqlMappingInput,
    sqlStore: SqlStore
): Promise<DataAndSeenRecords<D>> {
    const { sql: sqlString, bindings } = sql(query, mappingInput);

    return sqlStore
        .evaluateSQL(sqlString, bindings)
        .then((result) => {
            const data = JSON.parse(result) as D;
            const seenRecords = createSeenRecords(data);

            return { data, seenRecords };
        })
        .catch((err) => {
            metricsReporter.reportGraphqlCreateSnapshotError(err);

            throw err;
        });
}

export type StoreEval<D> = (
    ast: LuvioDocumentNode,
    nonEvaluatedSnapshotOrPromise: Snapshot<D, unknown> | Promise<Snapshot<D, unknown>>,
    alwaysReturnEvalSnapshot: boolean
) => Promise<Snapshot<D, unknown>>;

const wrapInstrumentation = <D>(storeEval: StoreEval<D>): StoreEval<D> => {
    return (
        ast: LuvioDocumentNode,
        nonEvaluatedSnapshotOrPromise: Snapshot<D, unknown> | Promise<Snapshot<D, unknown>>,
        alwaysReturnEvalSnapshot: boolean
    ) => {
        return storeEval(ast, nonEvaluatedSnapshotOrPromise, alwaysReturnEvalSnapshot).then(
            (snapshot) => {
                metricsReporter.reportGraphqlAdapterSuccess();

                return snapshot;
            }
        );
    };
};

export function storeEvalFactory<D>(
    userId: string,
    sqlDurableStore: SqlDurableStore
): StoreEval<D> {
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

    const storeEval: StoreEval<D> = (
        ast,
        nonEvaluatedSnapshotOrPromise,
        alwaysReturnEvalSnapshot
    ) => {
        const nonEvaluatedPromise = isPromise(nonEvaluatedSnapshotOrPromise)
            ? nonEvaluatedSnapshotOrPromise
            : Promise.resolve(nonEvaluatedSnapshotOrPromise);

        //add test
        if (sqlDurableStore.isEvalSupported() === false) {
            return nonEvaluatedPromise;
        }

        //add test
        const queryResult = makeEvalQuery(ast);
        if (queryResult.isSuccess === false) {
            const error = new Error(
                `Could not map GraphQL AST to SQL: ${JSON.stringify(queryResult.error)}`
            );
            metricsReporter.reportGraphqlSqlEvalPreconditionError(error);

            return nonEvaluatedPromise;
        }

        const processSnapshot = (nonEvaluatedSnapshot: Snapshot<D>): ReturnType<StoreEval<D>> => {
            // if the cached/network snapshot is fulfilled or stale then we return eval'ed
            // version of data so that draft-created records satisfying the predicate
            // are included
            if (
                nonEvaluatedSnapshot.state === 'Fulfilled' ||
                nonEvaluatedSnapshot.state === 'Stale'
            ) {
                //Add test
                return tableAttrsPromise(sqlDurableStore).then((mappingInput) => {
                    if (mappingInput === undefined) {
                        const error = new Error(
                            'DurableStore attrs required for evaluating GraphQL query.'
                        );
                        metricsReporter.reportGraphqlSqlEvalPreconditionError(error);
                        return nonEvaluatedSnapshot;
                    }

                    return evalSql(queryResult.value, mappingInput, sqlDurableStore).then(
                        ({ data, seenRecords }) => {
                            return { ...nonEvaluatedSnapshot, data, seenRecords } as Snapshot<D>;
                        }
                    );
                });
            }

            // if we are always supposed to return eval'ed result as fulfilled
            // then do that here
            if (alwaysReturnEvalSnapshot) {
                return tableAttrsPromise(sqlDurableStore).then((mappingInput) => {
                    //add test
                    if (mappingInput === undefined) {
                        const error = new Error(
                            'DurableStore attrs required for evaluating GraphQL query.'
                        );
                        metricsReporter.reportGraphqlSqlEvalPreconditionError(error);
                        return nonEvaluatedSnapshot;
                    }

                    return evalSql<D>(queryResult.value, mappingInput, sqlDurableStore).then(
                        ({ data, seenRecords }) => {
                            return createFulfilledSnapshot(data, seenRecords);
                        }
                    );
                });
            }

            return Promise.resolve(nonEvaluatedSnapshot);
        };

        // TODO [W-10490363]: log error?
        return nonEvaluatedPromise.then(processSnapshot).catch(() => nonEvaluatedPromise);
    };

    return wrapInstrumentation(storeEval);
}
