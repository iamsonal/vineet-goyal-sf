import { Adapter, AdapterFactory, LDS, Store, Environment } from '@ldsjs/engine';
import { bindWireRefresh, register } from '@ldsjs/lwc-lds';
import { GenerateGetApexWireAdapter, GetApexInvoker } from '@salesforce/lds-adapters-apex';
import { GetProduct, GetProductCategoryPath } from '@salesforce/lds-adapters-commerce-catalog';
import { ProductSearch } from '@salesforce/lds-adapters-commerce-search';
import { GetProductPrice } from '@salesforce/lds-adapters-commerce-store-pricing';
import { GetCommunityNavigationMenu } from '@salesforce/lds-adapters-community-navigation-menu';
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
    GetRecordNotifyChange,
    GetRecordTemplateCreate,
    GetRecordUi,
    GetRelatedListActions,
    GetRelatedListCount,
    GetRelatedListInfo,
    GetRelatedListRecordActions,
    GetRelatedListRecords,
    GetRelatedListsCount,
    GetRelatedListsInfo,
    MRU,
    UpdateLayoutUserState,
    UpdateRecord,
    UpdateRecordAvatar,
    UpdateRelatedListInfo,
    GetRelatedListInfoBatch,
    GetRelatedListRecordsBatch,
    GetNavItems,
} from '@salesforce/lds-adapters-uiapi';
import * as wireService from 'wire-service';
import { throttle } from '../utils';
import AdsBridge from './ads-bridge';
import {
    Instrumentation,
    incrementGetRecordNotifyChangeAllowCount,
    incrementGetRecordNotifyChangeDropCount,
    instrumentAdapter,
    setupInstrumentation,
} from './instrumentation';
import { setupMetadataWatcher } from './metadata';
import networkAdapter from './network-adapter';

const store = new Store();
const instrumentation = new Instrumentation();
const environment = new Environment(store, networkAdapter);
const lds = new LDS(environment, {
    instrument: instrumentation.instrumentNetwork.bind(instrumentation),
});

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

const getObjectInfoLdsAdapter = createLdsAdapter('getObjectInfo', GetObjectInfo);
export const _getObjectInfo = createImperativeFunction(getObjectInfoLdsAdapter);

const getObjectInfosLdsAdapter = createLdsAdapter('getObjectInfos', GetObjectInfos);
export const _getObjectInfos = createImperativeFunction(getObjectInfosLdsAdapter);

const getLayoutLdsAdapter = createLdsAdapter('getLayout', GetLayout);
export const _getLayout = createImperativeFunction(getLayoutLdsAdapter);

const getPicklistValuesByRecordTypeLdsAdapter = createLdsAdapter(
    'getPicklistValuesByRecordType',
    GetPicklistValuesByRecordType
);
export const _getPicklistValuesByRecordType = createImperativeFunction(
    getPicklistValuesByRecordTypeLdsAdapter
);

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

const getRelatedListInfoAdapter = createLdsAdapter('getRelatedListInfo', GetRelatedListInfo);
export const _getRelatedListInfo = createImperativeFunction(getRelatedListInfoAdapter);
export const getRelatedListInfo = registerWireAdapter(getRelatedListInfoAdapter);

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
export const getPicklistValuesByRecordType = registerWireAdapter(
    getPicklistValuesByRecordTypeLdsAdapter
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
export const getRelatedListActionsAdapter = createLdsAdapter(
    'getRelatedListActions',
    GetRelatedListActions
);
export const _getRelatedListActions = createImperativeFunction(getRelatedListActionsAdapter);
export const getRelatedListActions = registerWireAdapter(getRelatedListActionsAdapter);

export const getRelatedListsInfoAdapter = createLdsAdapter(
    'getRelatedListsInfo',
    GetRelatedListsInfo
);
export const _getRelatedListsInfo = createImperativeFunction(getRelatedListsInfoAdapter);
export const getRelatedListsInfo = registerWireAdapter(getRelatedListsInfoAdapter);

const baseUpdateRelatedListInfo = UpdateRelatedListInfo(lds);
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

export const getRelatedListRecordsAdapter = createLdsAdapter(
    'getRelatedListRecords',
    GetRelatedListRecords
);
export const _getRelatedListRecords = createImperativeFunction(getRelatedListRecordsAdapter);
export const getRelatedListRecords = registerWireAdapter(getRelatedListRecordsAdapter);

export const getRelatedListRecordActionsAdapter = createLdsAdapter(
    'getRelatedListRecordActions',
    GetRelatedListRecordActions
);
export const _getRelatedListRecordActions = createImperativeFunction(
    getRelatedListRecordActionsAdapter
);
export const getRelatedListRecordActions = registerWireAdapter(getRelatedListRecordActionsAdapter);

export const getRelatedListCountAdapter = createLdsAdapter(
    'getRelatedListCount',
    GetRelatedListCount
);
export const _getRelatedListCount = createImperativeFunction(getRelatedListCountAdapter);
export const getRelatedListCount = registerWireAdapter(getRelatedListCountAdapter);

export const getRelatedListsCountAdapter = createLdsAdapter(
    'getRelatedListsCount',
    GetRelatedListsCount
);
export const _getRelatedListsCount = createImperativeFunction(getRelatedListsCountAdapter);
export const getRelatedListsCount = registerWireAdapter(getRelatedListsCountAdapter);

export const getRelatedListInfoBatchAdapter = createLdsAdapter(
    'getRelatedListInfoBatch',
    GetRelatedListInfoBatch
);
export const _getRelatedListInfoBatch = createImperativeFunction(getRelatedListInfoBatchAdapter);
export const getRelatedListInfoBatch = registerWireAdapter(getRelatedListInfoBatchAdapter);

export const getRelatedListRecordsBatchAdapter = createLdsAdapter(
    'getRelatedListRecordsBatch',
    GetRelatedListRecordsBatch
);
export const _getRelatedListRecordsBatch = createImperativeFunction(
    getRelatedListRecordsBatchAdapter
);
export const getRelatedListRecordsBatch = registerWireAdapter(getRelatedListRecordsBatchAdapter);

const getRecordTemplateCreateAdapter = createLdsAdapter(
    'getRecordTemplateCreate',
    GetRecordTemplateCreate
);
export const _getRecordTemplateCreate = createImperativeFunction(getRecordTemplateCreateAdapter);
export const getRecordTemplateCreate = registerWireAdapter(getRecordTemplateCreateAdapter);

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
 * Apps
 */
const getNavItemsAdapter = createLdsAdapter('getNavItems', GetNavItems);
export const getNavItems = registerWireAdapter(getNavItemsAdapter);

/**
 * Commerce
 */

const getProductAdapter = createLdsAdapter('getProduct', GetProduct);
export const getProduct = registerWireAdapter(getProductAdapter);

const getProductCategoryPathAdapter = createLdsAdapter(
    'getProductCategoryPath',
    GetProductCategoryPath
);
export const getProductCategoryPath = registerWireAdapter(getProductCategoryPathAdapter);

const getProductPriceAdapter = createLdsAdapter('getProductPrice', GetProductPrice);
export const getProductPrice = registerWireAdapter(getProductPriceAdapter);

const productSearchAdapter = createLdsAdapter('productSearch', ProductSearch);
export const productSearch = registerWireAdapter(productSearchAdapter);

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
 * Misc.
 */
export const refresh = bindWireRefresh(lds);

export const adsBridge = new AdsBridge(lds);

export const getRecordNotifyChange = throttle(60, 60000, GetRecordNotifyChange(lds), {
    allowFunction: incrementGetRecordNotifyChangeAllowCount,
    dropFunction: incrementGetRecordNotifyChangeDropCount,
});
