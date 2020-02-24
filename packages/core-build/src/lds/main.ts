import { LDS, Store, AdapterFactory, Adapter } from '@ldsjs/engine';
import { register, bindWireRefresh } from '@ldsjs/lwc-lds';
import * as wireService from 'wire-service';

import { GenerateGetApexWireAdapter, GetApexInvoker } from '@salesforce/lds-adapters-apex';
import {
    CreateRecord,
    DeleteRecord,
    GetLayout,
    GetLayoutUserState,
    GetListUi,
    GetLookupActions,
    GetLookupRecords,
    GetObjectInfo,
    GetObjectInfos,
    GetPicklistValues,
    GetPicklistValuesByRecordType,
    GetRecord,
    GetRecordActions,
    GetRecordAvatars,
    GetRecordCreateDefaults,
    GetRecordEditActions,
    GetRecordUi,
    GetRelatedListActions,
    GetRelatedListInfo,
    GetRelatedListsInfo,
    GetRelatedListRecordActions,
    GetRelatedListRecords,
    GetRelatedListCount,
    GetRelatedListsCount,
    MRU,
    UpdateRecord,
    UpdateRecordAvatar,
    UpdateLayoutUserState,
    UpdateRelatedListInfo,
} from '@salesforce/lds-adapters-uiapi';

import { GetCommunityNavigationMenu } from '@salesforce/lds-adapters-community-navigation-menu';

import AdsBridge from './ads-bridge';
import networkAdapter from './network-adapter';
import { setupMetadataWatcher } from './metadata';
import { setupInstrumentation, instrumentAdapter, instrumentNetwork } from './instrumentation';

const store = new Store();
const lds = new LDS(store, networkAdapter, { instrument: instrumentNetwork });

setupInstrumentation(lds, store);
setupMetadataWatcher(lds);

/** Create a new LDS adapter from an adapter factory. */
const createLdsAdapter = <C, D>(name: string, factory: AdapterFactory<C, D>): Adapter<C, D> => {
    return instrumentAdapter(name, factory(lds));
};

/** Register an LDS adapter to the LWC Wire Service */
const registerWireAdapter = (adapter: Adapter<any, any>) => {
    return register(lds, wireService, adapter);
};

/** Create and register an LDS adapter factory. */
const setupWireAdapter = <C, D>(name: string, factory: AdapterFactory<C, D>): Adapter<C, D> => {
    const adapter = createLdsAdapter(name, factory);
    return registerWireAdapter(adapter);
};

/**
 * UI API
 */

/* TODO W-6568533 - replace this temporary imperative invocation with wire reform */
const createImperativeFunction = <C, D>(adapter: Adapter<C, D>) => {
    return (config: C): Promise<D> => {
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
            return Promise.resolve(result.data);
        }
        return Promise.reject(new Error('isMissingData=true'));
    };
};

const getObjectInfoLdsAdapter = createLdsAdapter('getObjectInfo', GetObjectInfo);
export const _getObjectInfo = createImperativeFunction(getObjectInfoLdsAdapter);

const getObjectInfosLdsAdapter = createLdsAdapter('getObjectInfos', GetObjectInfos);

const getLayoutLdsAdapter = createLdsAdapter('getLayout', GetLayout);
export const _getLayout = createImperativeFunction(getLayoutLdsAdapter);

const getRecordLdsAdapter = createLdsAdapter('getRecord', GetRecord);
export const _getRecord = createImperativeFunction(getRecordLdsAdapter);

const getRecordActionsLdsAdapter = GetRecordActions(lds);
export const _getRecordActions = createImperativeFunction(getRecordActionsLdsAdapter);

const getRecordAvatarsLdsAdapter = createLdsAdapter('getRecordAvatars', GetRecordAvatars);
export const _getRecordAvatars = createImperativeFunction(getRecordAvatarsLdsAdapter);

const getRecordUiLdsAdapter = createLdsAdapter('getRecordUi', GetRecordUi);
export const _getRecordUi = createImperativeFunction(getRecordUiLdsAdapter);

export const getLayoutUserStateLdsAdapter = createLdsAdapter(
    'getLayoutUserState',
    GetLayoutUserState
);
export const _getLayoutUserState = createImperativeFunction(getLayoutUserStateLdsAdapter);

export const getRelatedListInfo = setupWireAdapter('getRelatedListInfo', GetRelatedListInfo);
export const _getRelatedListInfo = createImperativeFunction(getRelatedListInfo);

const baseCreateRecord = CreateRecord(lds);
export const createRecord = (...config: Parameters<ReturnType<typeof CreateRecord>>) => {
    return baseCreateRecord(...config).then(snapshot => snapshot.data);
};
export const deleteRecord = DeleteRecord(lds);
export const getLayout = registerWireAdapter(getLayoutLdsAdapter);
export const getLayoutUserState = registerWireAdapter(getLayoutUserStateLdsAdapter);
export const getListUi = setupWireAdapter('getListUi', GetListUi);
export const getLookupActions = setupWireAdapter('getLookupActions', GetLookupActions);
export const getLookupRecords = setupWireAdapter('getLookupRecords', GetLookupRecords);
export const getObjectInfo = registerWireAdapter(getObjectInfoLdsAdapter);
export const getObjectInfos = registerWireAdapter(getObjectInfosLdsAdapter);
export const getPicklistValues = setupWireAdapter('getPicklistValues', GetPicklistValues);
export const getPicklistValuesByRecordType = setupWireAdapter(
    'getPicklistValuesByRecordType',
    GetPicklistValuesByRecordType
);
export const getRecord = registerWireAdapter(getRecordLdsAdapter);
export const getRecordActions = registerWireAdapter(getRecordActionsLdsAdapter);
export const getRecordAvatars = registerWireAdapter(getRecordAvatarsLdsAdapter);
export const getRecordCreateDefaults = setupWireAdapter(
    'getRecordCreateDefaults',
    GetRecordCreateDefaults
);
export const getRecordEditActions = setupWireAdapter('getRecordEditActions', GetRecordEditActions);
export const getRecordUi = registerWireAdapter(getRecordUiLdsAdapter);
export const getRelatedListActions = setupWireAdapter(
    'getRelatedListActions',
    GetRelatedListActions
);
export const _getRelatedListActions = createImperativeFunction(getRelatedListActions);

export const getRelatedListsInfo = setupWireAdapter('getRelatedListsInfo', GetRelatedListsInfo);
export const _getRelatedListsInfo = createImperativeFunction(getRelatedListsInfo);

export const updateRelatedListInfo = setupWireAdapter(
    'updateRelatedListInfo',
    UpdateRelatedListInfo
);

export const getRelatedListRecords = setupWireAdapter(
    'getRelatedListRecords',
    GetRelatedListRecords
);
export const _getRelatedListRecords = createImperativeFunction(getRelatedListRecords);

export const getRelatedListRecordActions = setupWireAdapter(
    'getRelatedListRecordActions',
    GetRelatedListRecordActions
);
export const _getRelatedListRecordActions = createImperativeFunction(getRelatedListRecordActions);

export const getRelatedListCount = setupWireAdapter('getRelatedListCount', GetRelatedListCount);
export const _getRelatedListCount = createImperativeFunction(getRelatedListCount);
export const getRelatedListsCount = setupWireAdapter('getRelatedListsCount', GetRelatedListsCount);
export const _getRelatedListsCount = createImperativeFunction(getRelatedListsCount);

const baseUpdateRecord = UpdateRecord(lds);
export const updateRecord = (...config: Parameters<ReturnType<typeof UpdateRecord>>) => {
    return baseUpdateRecord(...config).then(snapshot => snapshot.data);
};

const baseUpdateRecordAvatar = UpdateRecordAvatar(lds);
export const updateRecordAvatar = (
    ...config: Parameters<ReturnType<typeof UpdateRecordAvatar>>
) => {
    return baseUpdateRecordAvatar(...config).then(snapshot => snapshot.data);
};

// updateLayoutUserState adapter should always return undefined
const baseUpdateLayoutUserState = UpdateLayoutUserState(lds);
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

export { MRU };
export { getApexInvoker };

/**
 * Connect
 */

const getCommunityNavigationMenuAdapter = createLdsAdapter(
    'getCommunityNavigationMenu',
    GetCommunityNavigationMenu
);
export const getCommunityNavigationMenu = registerWireAdapter(getCommunityNavigationMenuAdapter);

/**
 * Apex
 */
const getApexInvoker = function(
    namespace: string,
    classname: string,
    method: string,
    isContinuation: boolean
) {
    const identifier = GetApexInvoker(lds, { namespace, classname, method, isContinuation });
    return register(
        lds,
        wireService,
        GenerateGetApexWireAdapter(lds, { namespace, classname, method, isContinuation }),
        identifier
    );
};

/**
 * Record Util Pure Functions
 */
export {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getFieldValue,
    getRecordInput,
    getSObjectValue,
} from 'lds-static-functions';

/**
 * Misc.
 */
export const refresh = bindWireRefresh(lds);

export const adsBridge = new AdsBridge(lds);
