import { createLDSAdapter } from '@salesforce/lds-bindings';

import {
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
} from '@salesforce/lds-instrumentation';

import { throttle } from './sfdc-util/throttle';

import {
    GetRecordNotifyChange,
    updateLayoutUserStateAdapterFactory,
    updateRelatedListInfoAdapterFactory,
} from './main';

export { MRU } from './wire/getListUi';
export * from './generated/artifacts/sfdc';

export { refresh } from '@salesforce/lds-bindings';

/** Custom adapters */
// updateLayoutUserState adapter should always return undefined
const baseUpdateLayoutUserState = createLDSAdapter(
    'updateLayoutUserState',
    updateLayoutUserStateAdapterFactory
);
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

const baseUpdateRelatedListInfo = createLDSAdapter(
    'baseUpdateRelatedListInfo',
    updateRelatedListInfoAdapterFactory
);
// In order to export the imperative wire correctly, we need to add some safety checks
// to ensure the config passed is correct
export const updateRelatedListInfo = (
    config: Parameters<ReturnType<typeof updateRelatedListInfoAdapterFactory>>[0]
) => {
    const value = baseUpdateRelatedListInfo(config);
    if (value === null) {
        throw new Error('Invalid config for updateRelatedListInfo');
    }
    if ('then' in value) {
        return value.then(snapshot => snapshot.data);
    }
    if (value.state === 'Error') {
        return Promise.reject(value.error);
    }

    return Promise.resolve(value.data);
};

/** SFDC utils */
export const getRecordNotifyChange = throttle(
    60,
    60000,
    createLDSAdapter('getRecordNotifyChange', GetRecordNotifyChange),
    {
        allowFunction: incrementGetRecordNotifyChangeAllowCount,
        dropFunction: incrementGetRecordNotifyChangeDropCount,
    }
);

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
export {
    ingest as ingestRecord,
    keyBuilder as keyBuilderRecord,
} from './generated/types/RecordRepresentation';
export {
    keyBuilder as keyBuilderObjectInfo,
    ingest as ingestObjectInfo,
} from './generated/types/ObjectInfoRepresentation';
