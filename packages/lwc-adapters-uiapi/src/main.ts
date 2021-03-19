import { Luvio } from '@luvio/engine';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
import { GetRecordNotifyChange as notifyChangeFactory } from '@salesforce/lds-adapters-uiapi';

export { MRU } from '@salesforce/lds-adapters-uiapi';

export let getRecordNotifyChange: any;

withDefaultLuvio((luvio: Luvio) => {
    getRecordNotifyChange = notifyChangeFactory(luvio);
});

export * from './generated/artifacts/bound-adapters';
