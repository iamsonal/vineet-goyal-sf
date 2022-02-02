import { Snapshot, TTLStrategy } from '@luvio/engine';
import { LuvioDocumentNode } from '@luvio/graphql-parser';

export type StoreEval = (
    ast: LuvioDocumentNode,
    ttlStrategy: TTLStrategy
) => Promise<Snapshot<unknown, any>>;
export let storeEval: StoreEval | undefined = undefined;

export const configuration = {
    setStoreEval: function (storeEvalArg: StoreEval | undefined): void {
        storeEval = storeEvalArg;
    },
};
