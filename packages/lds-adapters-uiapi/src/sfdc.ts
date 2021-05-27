import { Luvio } from '@luvio/engine';
import {
    bindWireRefresh,
    createLDSAdapter,
    refresh as refreshUiApi,
} from '@salesforce/lds-bindings';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';

import {
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
    REFRESH_UIAPI_KEY,
} from '@salesforce/lds-instrumentation';

import { throttle } from './sfdc-util/throttle';

import {
    GetRecordNotifyChange,
    updateLayoutUserStateAdapterFactory,
    updateRelatedListInfoAdapterFactory,
} from './main';

export { MRU } from './wire/getListUi';
export * from './generated/artifacts/sfdc';

export const refresh: typeof refreshUiApi = function <D>(data: D) {
    return refreshUiApi(data, REFRESH_UIAPI_KEY);
};

/** Custom adapters */
// updateLayoutUserState adapter should always return undefined
let baseUpdateLayoutUserState: ReturnType<typeof updateLayoutUserStateAdapterFactory>;

export const updateLayoutUserState = (
    apiName: unknown,
    recordTypeId: unknown,
    layoutType: unknown,
    mode: unknown,
    layoutUserStateInput: unknown
) => {
    return baseUpdateLayoutUserState(
        apiName,
        recordTypeId,
        layoutType,
        mode,
        layoutUserStateInput
    ).then(() => undefined);
};

// In order to export the imperative wire correctly, we need to add some safety checks
// to ensure the config passed is correct
let baseUpdateRelatedListInfo: ReturnType<typeof updateRelatedListInfoAdapterFactory>;

export const updateRelatedListInfo = (
    config: Parameters<ReturnType<typeof updateRelatedListInfoAdapterFactory>>[0]
) => {
    const value = baseUpdateRelatedListInfo(config);
    if (value === null) {
        throw new Error('Invalid config for updateRelatedListInfo');
    }
    if ('then' in value) {
        return value.then((snapshot) => snapshot.data);
    }
    if (value.state === 'Error') {
        return Promise.reject(value.error);
    }

    return Promise.resolve(value.data);
};

/** SFDC utils */
export let getRecordNotifyChange: any;

withDefaultLuvio((luvio: Luvio) => {
    bindWireRefresh(luvio);

    baseUpdateLayoutUserState = createLDSAdapter(
        luvio,
        'updateLayoutUserState',
        updateLayoutUserStateAdapterFactory
    );

    baseUpdateRelatedListInfo = createLDSAdapter(
        luvio,
        'baseUpdateRelatedListInfo',
        updateRelatedListInfoAdapterFactory
    );

    getRecordNotifyChange = throttle(
        60,
        60000,
        createLDSAdapter(luvio, 'getRecordNotifyChange', GetRecordNotifyChange),
        {
            allowFunction: incrementGetRecordNotifyChangeAllowCount,
            dropFunction: incrementGetRecordNotifyChangeDropCount,
        }
    );
});

export {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getFieldValue,
    getRecordInput,
} from './uiapi-static-functions';

// This ingestion method needs to be exposed to ingest records coming from the ADS Bridge.
// TODO W-5971944 - remove the ADS bridge and these exports
export { keyBuilder as keyBuilderRecord } from './generated/types/RecordRepresentation';
export { ingest as ingestRecord } from './raml-artifacts/types/RecordRepresentation/ingest';
export {
    keyBuilder as keyBuilderObjectInfo,
    ingest as ingestObjectInfo,
} from './generated/types/ObjectInfoRepresentation';

// Expose the configuration object
export { configuration } from '../src/main';
