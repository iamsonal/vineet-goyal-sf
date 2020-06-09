import { Adapter, AdapterFactory, LDS, Store, Environment } from '@ldsjs/engine';
import { bindWireRefresh, createWireAdapterConstructor, register } from '@ldsjs/lwc-lds';
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
    GetRecordTemplateClone,
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

/**
 * TODO W-6568533 - remove imperative? parameter, change return type to Adapter<C,D>
 */
const setupWireAdapter = <C, D>(
    name: string,
    factory: AdapterFactory<C, D>,
    imperative?: boolean
): [any /* WireAdapterConstructor */, ((config: C) => D | Promise<D>) | null] => {
    const instrumentedAdapter = instrumentAdapter(name, factory(lds));
    return [
        createWireAdapterConstructor(
            instrumentedAdapter as Adapter<unknown, unknown>,
            name + 'Constructor',
            lds
        ),
        imperative ? createImperativeFunction(instrumentedAdapter) : null,
    ];
};

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

/**
 * UI API
 */
export const [getLayout, _getLayout] = setupWireAdapter('getLayout', GetLayout, true);

export const [getLayoutUserState, _getLayoutUserState] = setupWireAdapter(
    'getLayoutUserState',
    GetLayoutUserState,
    true
);
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

export const [getListUi] = setupWireAdapter('getListUi', GetListUi);
export const [getLookupActions] = setupWireAdapter('getLookupActions', GetLookupActions);
export const [getLookupRecords] = setupWireAdapter('getLookupRecords', GetLookupRecords);
export const [getObjectInfo, _getObjectInfo] = setupWireAdapter(
    'getObjectInfo',
    GetObjectInfo,
    true
);
export const [getObjectInfos, _getObjectInfos] = setupWireAdapter(
    'getObjectInfos',
    GetObjectInfos,
    true
);
export const [getPicklistValues] = setupWireAdapter('getPicklistValues', GetPicklistValues);
export const [getPicklistValuesByRecordType, _getPicklistValuesByRecordType] = setupWireAdapter(
    'getPicklistValuesByRecordType',
    GetPicklistValuesByRecordType,
    true
);

export const [getRecord, _getRecord] = setupWireAdapter('getRecord', GetRecord, true);
const baseCreateRecord = CreateRecord(lds);
export const createRecord = (...config: Parameters<ReturnType<typeof CreateRecord>>) => {
    return baseCreateRecord(...config).then(snapshot => snapshot.data);
};
export const deleteRecord = DeleteRecord(lds);
const baseUpdateRecord = UpdateRecord(lds);
export const updateRecord = (...config: Parameters<ReturnType<typeof UpdateRecord>>) => {
    return baseUpdateRecord(...config).then(snapshot => snapshot.data);
};

export const [getRecordActions, _getRecordActions] = setupWireAdapter(
    'getRecordActions',
    GetRecordActions,
    true
);

export const [getRecordAvatars, _getRecordAvatars] = setupWireAdapter(
    'getRecordAvatars',
    GetRecordAvatars,
    true
);
const baseUpdateRecordAvatar = UpdateRecordAvatar(lds);
export const updateRecordAvatar = (
    ...config: Parameters<ReturnType<typeof UpdateRecordAvatar>>
) => {
    return baseUpdateRecordAvatar(...config).then(snapshot => snapshot.data);
};

export const [getRecordCreateDefaults] = setupWireAdapter(
    'getRecordCreateDefaults',
    GetRecordCreateDefaults
);
export const [getRecordEditActions] = setupWireAdapter(
    'getRecordEditActions',
    GetRecordEditActions
);
export const [getRecordTemplateCreate, _getRecordTemplateCreate] = setupWireAdapter(
    'getRecordTemplateCreate',
    GetRecordTemplateCreate,
    true
);
export const [getRecordTemplateClone, _getRecordTemplateClone] = setupWireAdapter(
    'getRecordTemplateClone',
    GetRecordTemplateClone,
    true
);
export const [getRecordUi, _getRecordUi] = setupWireAdapter('getRecordUi', GetRecordUi, true);
export const [getRelatedListActions, _getRelatedListActions] = setupWireAdapter(
    'getRelatedListActions',
    GetRelatedListActions,
    true
);
export const [getRelatedListCount, _getRelatedListCount] = setupWireAdapter(
    'getRelatedListCount',
    GetRelatedListCount,
    true
);

export const [getRelatedListInfo, _getRelatedListInfo] = setupWireAdapter(
    'getRelatedListInfo',
    GetRelatedListInfo,
    true
);
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

export const [getRelatedListInfoBatch, _getRelatedListInfoBatch] = setupWireAdapter(
    'getRelatedListInfoBatch',
    GetRelatedListInfoBatch,
    true
);
export const [getRelatedListRecordActions, _getRelatedListRecordActions] = setupWireAdapter(
    'getRelatedListRecordActions',
    GetRelatedListRecordActions,
    true
);
export const [getRelatedListRecords, _getRelatedListRecords] = setupWireAdapter(
    'getRelatedListRecords',
    GetRelatedListRecords,
    true
);
export const [getRelatedListRecordsBatch, _getRelatedListRecordsBatch] = setupWireAdapter(
    'getRelatedListRecordsBatch',
    GetRelatedListRecordsBatch,
    true
);
export const [getRelatedListsCount, _getRelatedListsCount] = setupWireAdapter(
    'getRelatedListsCount',
    GetRelatedListsCount,
    true
);
export const [getRelatedListsInfo, _getRelatedListsInfo] = setupWireAdapter(
    'getRelatedListsInfo',
    GetRelatedListsInfo,
    true
);

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
export const [getCommunityNavigationMenu] = setupWireAdapter(
    'getCommunityNavigationMenu',
    GetCommunityNavigationMenu
);

/**
 * Apps
 */
export const [getNavItems] = setupWireAdapter('getNavItems', GetNavItems);

/**
 * Commerce
 */
export const [getProduct] = setupWireAdapter('getProduct', GetProduct);
export const [getProductCategoryPath] = setupWireAdapter(
    'getProductCategoryPath',
    GetProductCategoryPath
);
export const [getProductPrice] = setupWireAdapter('getProductPrice', GetProductPrice);
export const productSearch = setupWireAdapter('productSearch', ProductSearch);

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
