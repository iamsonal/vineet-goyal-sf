import type { StoreEval } from '@salesforce/lds-graphql-eval';

export let storeEval: StoreEval<unknown> | undefined = undefined;

export const configuration = {
    setStoreEval: function (storeEvalArg: typeof storeEval): void {
        storeEval = storeEvalArg;
    },
};
