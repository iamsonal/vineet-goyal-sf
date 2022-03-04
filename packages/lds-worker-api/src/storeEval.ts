import { configuration } from '@salesforce/lds-adapters-graphql';
import { storeEval } from '@salesforce/lds-runtime-mobile';

export function initializeStoreEval() {
    configuration.setStoreEval(storeEval);
}
