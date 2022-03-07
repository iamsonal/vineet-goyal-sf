import type { Luvio } from '@luvio/engine';
import { bindWireRefresh } from '@luvio/lwc-luvio';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
import { GetRecordNotifyChange as notifyChangeFactory } from '@salesforce/lds-adapters-uiapi';

export {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getRecordInput,
    getFieldValue,
    MRU,
} from '@salesforce/lds-adapters-uiapi';

export let getRecordNotifyChange: any, refresh: any;

withDefaultLuvio((luvio: Luvio) => {
    getRecordNotifyChange = notifyChangeFactory(luvio);
    refresh = bindWireRefresh(luvio);
});

export * from './generated/artifacts/bound-adapters';
