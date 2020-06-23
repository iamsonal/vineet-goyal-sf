import { Adapter } from '@ldsjs/engine';

import { createLDSAdapter } from '@salesforce/lds-bindings';

import {
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
} from '@salesforce/lds-instrumentation';

import { throttle } from './sfdc-util/throttle';

import {
    GetObjectInfo,
    GetObjectInfos,
    GetPicklistValuesByRecordType,
    GetRecord,
    GetRecordActions,
    GetRecordAvatars,
    GetLayout,
    GetLayoutUserState,
    GetRelatedListActions,
    GetRelatedListCount,
    GetRelatedListsCount,
    GetRelatedListInfo,
    GetRelatedListInfoBatch,
    GetRelatedListRecordActions,
    GetRelatedListRecords,
    GetRelatedListRecordsBatch,
    GetRelatedListsActions,
    GetRelatedListsInfo,
    GetRecordNotifyChange,
    GetRecordTemplateClone,
    GetRecordTemplateCreate,
    GetRecordUi,
    UpdateLayoutUserState,
    UpdateRelatedListInfo,
} from './main';

export { MRU } from './wire/getListUi';
export * from './generated/artifacts/sfdc';

export { refresh } from '@salesforce/lds-bindings';

/** Custom adapters */
// updateLayoutUserState adapter should always return undefined
const baseUpdateLayoutUserState = createLDSAdapter('updateLayoutUserState', UpdateLayoutUserState);
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
    UpdateRelatedListInfo
);
// In order to export the imperative wire correctly, we need to add some safety checks
// to ensure the config passed is correct
export const updateRelatedListInfo = (
    config: Parameters<ReturnType<typeof UpdateRelatedListInfo>>[0]
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

/** Temp imperative adapters */
/* TODO W-6568533 - replace this temporary imperative invocation with wire reform */
const createImperativeFunction = <C, D>(adapter: Adapter<C, D>) => {
    return (config: C): D | Promise<D> => {
        const result = adapter(config);
        if (result === null) {
            return Promise.reject(new Error('Insufficient config'));
        } else if ('then' in result) {
            return result.then(snapshot => {
                if (snapshot.state === 'Error') {
                    throw snapshot.error;
                }
                return snapshot.data;
            }) as Promise<D>;
        } else if (result.state === 'Fulfilled') {
            return result.data;
        }
        return Promise.reject(new Error('isMissingData=true'));
    };
};

export const _getLayout = createImperativeFunction(createLDSAdapter('getLayout', GetLayout));
export const _getLayoutUserState = createImperativeFunction(
    createLDSAdapter('getLayoutUserState', GetLayoutUserState)
);
export const _getObjectInfo = createImperativeFunction(
    createLDSAdapter('getObjectInfo', GetObjectInfo)
);
export const _getObjectInfos = createImperativeFunction(
    createLDSAdapter('getObjectInfos', GetObjectInfos)
);
export const _getPicklistValuesByRecordType = createImperativeFunction(
    createLDSAdapter('getPicklistValuesByRecordType', GetPicklistValuesByRecordType)
);
export const _getRecord = createImperativeFunction(createLDSAdapter('getRecord', GetRecord));
export const _getRecordActions = createImperativeFunction(
    createLDSAdapter('getRecordActions', GetRecordActions)
);
export const _getRecordAvatars = createImperativeFunction(
    createLDSAdapter('getRecordAvatars', GetRecordAvatars)
);
export const _getRecordUi = createImperativeFunction(createLDSAdapter('getRecordUi', GetRecordUi));
export const _getRecordTemplateClone = createImperativeFunction(
    createLDSAdapter('getRecordTemplateClone', GetRecordTemplateClone)
);
export const _getRecordTemplateCreate = createImperativeFunction(
    createLDSAdapter('getRecordTemplateCreate', GetRecordTemplateCreate)
);
export const _getRelatedListActions = createImperativeFunction(
    createLDSAdapter('getRelatedListActions', GetRelatedListActions)
);
export const _getRelatedListInfo = createImperativeFunction(
    createLDSAdapter('getRelatedListInfo', GetRelatedListInfo)
);
export const _getRelatedListInfoBatch = createImperativeFunction(
    createLDSAdapter('getRelatedListInfo', GetRelatedListInfoBatch)
);
export const _getRelatedListRecordActions = createImperativeFunction(
    createLDSAdapter('getRelatedListRecordActions', GetRelatedListRecordActions)
);
export const _getRelatedListRecords = createImperativeFunction(
    createLDSAdapter('getRelatedListRecords', GetRelatedListRecords)
);
export const _getRelatedListRecordsBatch = createImperativeFunction(
    createLDSAdapter('getRelatedListRecordsBatch', GetRelatedListRecordsBatch)
);
export const _getRelatedListsInfo = createImperativeFunction(
    createLDSAdapter('getRelatedListsInfo', GetRelatedListsInfo)
);
export const _getRelatedListsActions = createImperativeFunction(
    createLDSAdapter('getRelatedListsActions', GetRelatedListsActions)
);
export const _getRelatedListCount = createImperativeFunction(
    createLDSAdapter('getRelatedListCount', GetRelatedListCount)
);
export const _getRelatedListsCount = createImperativeFunction(
    createLDSAdapter('getRelatedListsCount', GetRelatedListsCount)
);

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
