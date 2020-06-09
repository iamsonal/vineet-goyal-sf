import { LDS, Store, Environment } from '@ldsjs/engine';
import { BridgeNetworkProvider } from './MobileNetworkAdapter';
import { MobileBridge, AdapterMap } from './MobileBridge';

import {
    CreateRecord,
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
    GetRecordTemplateClone,
    GetRecordTemplateCreate,
    GetRecordEditActions,
    GetRecordUi,
    GetRelatedListActions,
    GetRelatedListCount,
    GetRelatedListInfo,
    GetRelatedListRecordActions,
    GetRelatedListRecords,
    GetRelatedListsCount,
    GetRelatedListsInfo,
    UpdateRecord,
    UpdateRecordAvatar,
    UpdateRelatedListInfo,
    GetRelatedListInfoBatch,
    GetRelatedListRecordsBatch,
    UpdateLayoutUserState,
    DeleteRecord,
    MRU,
    GetNavItems,
    GetDuplicateConfiguration,
    GetDuplicates,
} from '@salesforce/lds-adapters-uiapi';

import { GetProduct, GetProductCategoryPath } from '@salesforce/lds-adapters-commerce-catalog';
import { ProductSearch } from '@salesforce/lds-adapters-commerce-search';
import { GetProductPrice } from '@salesforce/lds-adapters-commerce-store-pricing';
import { GetCommunityNavigationMenu } from '@salesforce/lds-adapters-community-navigation-menu';

const store = new Store();
// TODO: this will eventually be made an offline environment (W-7386475: [lds-jscore][optimistic-emit] Enable OfflineStore in mobile lds target)
const environment = new Environment(store, BridgeNetworkProvider);
const lds = new LDS(environment);

export const getRecord = GetRecord(lds);
export const deleteRecord = DeleteRecord(lds);
export const createRecord = CreateRecord(lds);
export const getLayout = GetLayout(lds);
export const getLayoutUserState = GetLayoutUserState(lds);
export const getLookupRecords = GetLookupRecords(lds);
export const getRecordAvatars = GetRecordAvatars(lds);
export const getRecordUi = GetRecordUi(lds);
export const getPicklistValues = GetPicklistValues(lds);
export const getPicklistValuesByRecordType = GetPicklistValuesByRecordType(lds);
export const updateRecord = UpdateRecord(lds);
export const updateLayoutUserState = UpdateLayoutUserState(lds);
export const updateRecordAvatar = UpdateRecordAvatar(lds);
export const getRecordCreateDefaults = GetRecordCreateDefaults(lds);
export const getRecordTemplateClone = GetRecordTemplateClone(lds);
export const getRecordTemplateCreate = GetRecordTemplateCreate(lds);
export const getRelatedListInfo = GetRelatedListInfo(lds);
export const getLookupActions = GetLookupActions(lds);
export const getRecordActions = GetRecordActions(lds);
export const getRelatedListActions = GetRelatedListActions(lds);
export const getRecordEditActions = GetRecordEditActions(lds);
export const getRelatedListRecordActions = GetRelatedListRecordActions(lds);
export const getObjectInfo = GetObjectInfo(lds);
export const updateRelatedListInfo = UpdateRelatedListInfo(lds);
export const getObjectInfos = GetObjectInfos(lds);
export const getRelatedListCount = GetRelatedListCount(lds);
export const getRelatedListRecords = GetRelatedListRecords(lds);
export const getRelatedListsCount = GetRelatedListsCount(lds);
export const getRelatedListsInfo = GetRelatedListsInfo(lds);
export const getRelatedListInfoBatch = GetRelatedListInfoBatch(lds);
export const getRelatedListRecordsBatch = GetRelatedListRecordsBatch(lds);
export const getListUi = GetListUi(lds);
export const getProduct = GetProduct(lds);
export const getProductCategoryPath = GetProductCategoryPath(lds);
export const productSearch = ProductSearch(lds);
export const getProductPrice = GetProductPrice(lds);
export const getCommunityNavigationMenu = GetCommunityNavigationMenu(lds);
export const getNavItems = GetNavItems(lds);

export { MRU };
export const getDuplicateConfiguration = GetDuplicateConfiguration(lds);
export const getDuplicates = GetDuplicates(lds);

const adapterMap: AdapterMap = {
    createRecord,
    // TODO: W-7399251 - [lds-jscore] support DeleteRecord adapter
    // deleteRecord,
    getLayout,
    getLayoutUserState,
    getLookupRecords,
    getRecord: getRecord,
    getRecordAvatars,
    getRecordUi,
    getPicklistValues,
    getPicklistValuesByRecordType,
    updateRecord,
    // TODO: W-7399249 - [lds-jscore] support UpdateLayoutUserState adapter
    // updateLayoutUserState,
    updateRecordAvatar,
    getRecordCreateDefaults,
    getRecordTemplateClone,
    getRecordTemplateCreate,
    getRelatedListInfo,
    getLookupActions,
    getRecordActions,
    getRelatedListActions,
    getRecordEditActions,
    getRelatedListRecordActions,
    getObjectInfo,
    updateRelatedListInfo,
    getObjectInfos,
    getRelatedListCount,
    getRelatedListRecords,
    getRelatedListsCount,
    getRelatedListsInfo,
    getRelatedListInfoBatch,
    getRelatedListRecordsBatch,
    getListUi,
    getProduct,
    productSearch,
    getProductPrice,
    getProductCategoryPath,
    getCommunityNavigationMenu,
    getNavItems,
    getDuplicateConfiguration,
    getDuplicates,
};

const mobileBridge = new MobileBridge(lds, adapterMap);
export { mobileBridge };
