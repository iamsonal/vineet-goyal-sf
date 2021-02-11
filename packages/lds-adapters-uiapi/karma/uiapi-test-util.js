'use strict';

import timekeeper from 'timekeeper';
import sinon from 'sinon';
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkSequence } from 'test-util';

import {
    FormFactor,
    LayoutMode,
    LayoutType,
    MASTER_RECORD_TYPE_ID,
    ACTIONS_TTL,
    CREATE_TEMPLATE_REPRESENTATION_TTL,
    CREATE_RECORD_TEMPLATE_REPRESENTATION_TTL,
    CLONE_TEMPLATE_REPRESENTATION_TTL,
    LAYOUT_TTL,
    LAYOUT_USER_STATE_TTL,
    LIST_INFO_TTL,
    RECORD_TTL,
    RECORD_AVATAR_TTL,
    RECORD_DEFAULTS_REPRESENTATION_TTL,
    RECORD_UI_TTL,
    OBJECT_INFO_TTL,
    PICKLIST_VALUES_TTL,
    PICKLIST_VALUES_COLLECTION_TTL,
    RELATED_LIST_INFO_TTL,
    NAV_ITEMS_TTL,
    DUPLICATE_CONFIGURATION_TTL,
    DUPLICATES_TTL,
} from './dist/uiapi-constants';

const API_VERSION = 'v52.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/ui-api`;

// FIXME: update to a real value once TTL is implemented
const LIST_UI_TTL = 60 * 1000;
const LOOKUP_RECORDS_TTL = 2 * 60 * 1000;

function mockCreateRecordNetwork(config, mockData) {
    const { useDefaultRule, triggerOtherEmail, triggerUserEmail, ...body } = config;
    const queryParams = { useDefaultRule, triggerOtherEmail, triggerUserEmail };

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/records`,
        method: 'post',
        body,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockDeleteRecordNetwork(recordId, mockData = {}) {
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/records/${recordId}`,
        method: 'delete',
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetAvatarsNetwork(config, mockData) {
    const { recordIds, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/record-avatars/batch/${recordIds.join(',')}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetLayoutNetwork(config, mockData) {
    let { objectApiName, ...queryParams } = config;

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/layout/${objectApiName}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetLayoutUserStateNetwork(config, mockData) {
    let { objectApiName, ...queryParams } = config;

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/layout/${objectApiName}/user-state`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetListInfoByNameNetwork(config, mockData) {
    const { objectApiName, listViewApiName } = config;
    const queryParams = { ...config };
    delete queryParams.objectApiName;
    delete queryParams.listViewApiName;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/list-info/${objectApiName}/${listViewApiName}`,
        queryParams,
    });
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordNetwork(config, mockData) {
    const { recordId, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/records/${recordId}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordsNetwork(config, mockData) {
    const allRecordIds = [],
        allFields = [],
        allOptionalFields = [];
    config.records.forEach(rec => {
        const { recordIds = [], fields = [], optionalFields = [] } = rec;
        allRecordIds.push(...recordIds);
        allFields.push(...fields);
        allOptionalFields.push(...optionalFields);
    });
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/records/batch/${allRecordIds.join(',')}`,
        queryParams: {
            fields: allFields.length > 0 ? allFields : undefined,
            optionalFields: allOptionalFields.length > 0 ? allOptionalFields : undefined,
        },
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordActionsNetwork(config, mockData) {
    const { recordIds, ...queryParams } = config;
    const basePath = `${URL_BASE}/actions/record/${recordIds.sort().join(',')}`;
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetGlobalActionsNetwork(config, mockData) {
    const { ...queryParams } = config;
    const basePath = `${URL_BASE}/actions/global`;
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}
function mockGetRelatedListActionsNetwork(config, mockData) {
    const { recordIds, relatedListId, ...queryParams } = config;
    const basePath = `${URL_BASE}/actions/record/${recordIds
        .sort()
        .join(',')}/related-list/${relatedListId}`;
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRelatedListsActionsNetwork(config, mockData) {
    const { recordIds, relatedListIds, ...queryParams } = config;
    const basePath = `${URL_BASE}/actions/record/${recordIds
        .sort()
        .join(',')}/related-list/batch/${relatedListIds.sort().join(',')}`;
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordEditActionsNetwork(config, mockData) {
    const { recordIds, ...queryParams } = config;
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/actions/record/${recordIds.sort().join(',')}/record-edit`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetObjectCreateActionsNetwork(config, mockData) {
    let { objectApiName, ...queryParams } = config;

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/actions/object/${objectApiName}/record-create`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordCreateDefaultsNetwork(config, mockData) {
    let { objectApiName, ...queryParams } = config;

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/record-defaults/create/${objectApiName}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordTemplateCreateNetwork(config, mockData) {
    let { objectApiName, ...queryParams } = config;

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/record-defaults/template/create/${objectApiName}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordTemplateCloneNetwork(config, mockData) {
    const { recordId, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/record-defaults/template/clone/${recordId}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordUiNetwork(config, mockData) {
    const { recordIds, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/record-ui/${recordIds}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockUpdateRecordNetwork(recordId, updateParams, mockData, headers) {
    const { useDefaultRule, triggerOtherEmail, triggerUserEmail, ...body } = updateParams;
    const queryParams = { useDefaultRule, triggerOtherEmail, triggerUserEmail };

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/records/${recordId}`,
        method: 'patch',
        body,
        queryParams,
        ...(headers && { headers }),
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockUpdateLayoutUserStateNetwork(config, body, mockData) {
    let { objectApiName, ...queryParams } = config;

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    const paramMatch = sinon.match({
        method: 'patch',
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/layout/${objectApiName}/user-state`,
        queryParams,
        body: {
            ...body,
        },
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetRelatedListRecordNetwork(config, mockData) {
    const { recordIds, relatedListRecordIds, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/actions/record/${recordIds
            .sort()
            .join(',')}/related-list-record/${relatedListRecordIds.sort().join(',')}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRelatedListRecordsNetwork(config, mockData) {
    const { parentRecordId, relatedListId } = config;
    const queryParams = { ...config };
    delete queryParams.parentRecordId;
    delete queryParams.relatedListId;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-records/${parentRecordId}/${relatedListId}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRelatedListRecordsBatchNetwork(config, mockData) {
    const { parentRecordId, relatedListIds } = config;
    const queryParams = { ...config };
    delete queryParams.parentRecordId;
    delete queryParams.relatedListIds;

    const csvRelatedListIds = relatedListIds.join();

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-records/batch/${parentRecordId}/${csvRelatedListIds}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetObjectInfoNetwork(config, mockData) {
    let { objectApiName, ...queryParams } = config;

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/object-info/${objectApiName}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetObjectInfosNetwork(config, mockData) {
    let { objectApiNames, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/object-info/batch/${objectApiNames}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetPicklistValuesNetwork(config, mockData) {
    let { objectApiName, fieldApiName, recordTypeId } = config;

    if (fieldApiName) {
        if (typeof fieldApiName === 'string') {
            [objectApiName, fieldApiName] = config.fieldApiName.split('.');
        } else {
            objectApiName = fieldApiName.objectApiName;
            fieldApiName = fieldApiName.fieldApiName;
        }
    }

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    let basePath =
        fieldApiName === undefined
            ? `${URL_BASE}/object-info/${objectApiName}/picklist-values/${recordTypeId}`
            : `${URL_BASE}/object-info/${objectApiName}/picklist-values/${recordTypeId}/${fieldApiName}`;

    const paramMatch = sinon.match({ basePath });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRelatedListInfoNetwork(config, mockData) {
    const { parentObjectApiName, relatedListId } = config;
    const queryParams = { ...config };
    delete queryParams.parentObjectApiName;
    delete queryParams.relatedListId;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-info/${parentObjectApiName}/${relatedListId}`,
        queryParams,
    });
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRelatedListInfoBatchNetwork(config, mockData) {
    const parentObjectApiName = config.parentObjectApiName;
    const relatedListNames = config.relatedListNames;
    const queryParams = { ...config };
    delete queryParams.parentObjectApiName;
    delete queryParams.relatedListNames;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-info/batch/${parentObjectApiName}/${relatedListNames}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetNavItemsNetwork(config, mockData) {
    const queryParams = { ...config };

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/nav-items`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDuplicatesConfigurationNetwork(config, mockData) {
    let { objectApiName, ...queryParams } = config;

    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/duplicates/${objectApiName}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetDuplicatesNetwork(config, mockData) {
    const paramMatch = sinon.match({
        baseUri: BASE_URI,
        basePath: `${URL_BASE}/predupe`,
        method: 'post',
        body: config,
    });
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function expireDuplicateConfiguration() {
    timekeeper.travel(Date.now() + DUPLICATE_CONFIGURATION_TTL + 1);
}

function expireDuplicatesRepresentation() {
    timekeeper.travel(Date.now() + DUPLICATES_TTL + 1);
}

/**
 * Force a cache expiration for records by fast-forwarding time past the
 * standard record TTL.
 */
function expireRecords() {
    timekeeper.travel(Date.now() + RECORD_TTL + 1);
}

/**
 * Force a cache expiration for record avatars by fast-forwarding time past the
 * standard record avatars TTL.
 */
function expireRecordAvatar() {
    timekeeper.travel(Date.now() + RECORD_AVATAR_TTL + 1);
}

/**
 * Force a cache expiration for record-ui by fast-forwarding time past the
 * standard record-ui TTL.
 */
function expireRecordUi() {
    timekeeper.travel(Date.now() + RECORD_UI_TTL + 1);
}

/**
 * Force a cache expiration for related-list-info by fast-forwarding time past the
 * standard related-list-info TTL.
 */
function expireRelatedListInfo() {
    timekeeper.travel(Date.now() + RELATED_LIST_INFO_TTL + 1);
}

/**
 * Force a cache expiration for list-ui by fast-forwarding time past the
 * standard list TTL.
 */
function expireListUi() {
    timekeeper.travel(Date.now() + LIST_UI_TTL + 1);
}

/**
 * Force a cache expiration for list-info by fast-forwarding time past the
 * standard list TTL.
 */
function expireListInfo() {
    timekeeper.travel(Date.now() + LIST_INFO_TTL + 1);
}

/**
 * Force a cache expiration for getPicklistValues by fast-forwarding time past the
 * standard picklist values TTL.
 */
function expirePicklistValues() {
    timekeeper.travel(Date.now() + PICKLIST_VALUES_TTL + 1);
}

/**
 * Force a cache expiration for object-info by fast-forwarding time past the
 * standard object-info TTL.
 */
function expireObjectInfo() {
    timekeeper.travel(Date.now() + OBJECT_INFO_TTL + 1);
}

/**
 * Force a cache expiration for picklist values collection by fast-forwarding time past the
 * standard picklist values collection TTL.
 */
function expirePicklistValuesCollection() {
    timekeeper.travel(Date.now() + PICKLIST_VALUES_COLLECTION_TTL + 1);
}

/**
 * Force a cache expiration for layout by fast-forwarding time past the
 * standard layout TTL.
 */
function expireLayout() {
    timekeeper.travel(Date.now() + LAYOUT_TTL + 1);
}

/**
 * Force a cache expiration for layout user state by fast-forwarding time past the
 * standard layout user state TTL.
 */
function expireLayoutUserState() {
    timekeeper.travel(Date.now() + LAYOUT_USER_STATE_TTL + 1);
}

/**
 * Force a cache expiration for actions by fast-forwarding time past the
 * standard actions TTL.
 */
function expireActions() {
    timekeeper.travel(Date.now() + ACTIONS_TTL + 1);
}

/**
 * Force a cache expiration for lookup actions by fast-forwarding time past the
 * standard lookup actions TTL.
 */
function expireLookupRecords() {
    timekeeper.travel(Date.now() + LOOKUP_RECORDS_TTL + 1);
}

/**
 * Force a cache expiration for RecordDefaultsRepresentation by fast-forwarding time past the
 * standard RecordDefaultsRepresentation TTL.
 */
function expireRecordDefaultsRepresentation() {
    timekeeper.travel(Date.now() + RECORD_DEFAULTS_REPRESENTATION_TTL + 1);
}

/**
 * Force a cache expiration for navItems by fast-forwarding time past the
 * standard NavItemsPepresentation TTL.
 */
function expireNavItems() {
    timekeeper.travel(Date.now() + NAV_ITEMS_TTL + 1);
}

/**
 * Force a cache expiration for CreateTemplateRepresentation by fast-forwarding time past the
 * standard CreateTemplateRepresentation TTL.
 */
function expireCreateTemplateRepresentation() {
    timekeeper.travel(Date.now() + CREATE_TEMPLATE_REPRESENTATION_TTL + 1);
}

/**
 * Force a cache expiration for CreateRecordTemplateRepresentation by fast-forwarding time past the
 * standard CreateRecordTemplateRepresentation TTL.
 */
function expireCreateRecordTemplateRepresentation() {
    timekeeper.travel(Date.now() + CREATE_RECORD_TEMPLATE_REPRESENTATION_TTL + 1);
}

/**
 * Force a cache expiration for CloneTemplateRepresentation by fast-forwarding time past the
 * standard CloneTemplateRepresentation TTL.
 */
function expireCloneTemplateRepresentation() {
    timekeeper.travel(Date.now() + CLONE_TEMPLATE_REPRESENTATION_TTL + 1);
}

function isSpanningRecord(value) {
    return value !== null && typeof value === 'object';
}

function getFullApiName(path) {
    const apiName = [];
    let currentPath = path;
    while (currentPath) {
        apiName.unshift(currentPath.apiName);
        currentPath = currentPath.parent;
    }
    return apiName.join('.');
}

function extractRecordFieldsAtPath(path) {
    const { record } = path;
    const fieldKeys = Object.keys(record.fields);
    const { length } = fieldKeys;
    const fields = [];
    for (let i = 0; i < length; i += 1) {
        const key = fieldKeys[i];
        const fieldValue = record.fields[key].value;

        // Spanning record detected
        if (isSpanningRecord(fieldValue)) {
            const spanningRecordPath = {
                record: fieldValue,
                apiName: key,
                parent: path,
            };

            fields.push(...extractRecordFieldsAtPath(spanningRecordPath));
        } else {
            fields.push(`${getFullApiName(path)}.${key}`);
        }
    }
    return fields;
}

function extractRecordFields(record, options) {
    const path = {
        apiName: record.apiName,
        parent: null,
        record,
    };
    let fields = extractRecordFieldsAtPath(path);

    if (options) {
        const { omit, add } = options;
        if (omit) {
            fields = fields.filter(name => options.omit.indexOf(name) === -1);
        }
        if (add) {
            fields.push(...add);
            fields.sort();
        }
    }

    return fields;
}

function convertRelatedListsBatchParamsToResourceParams(parameters) {
    var relatedListIds = [];
    var fields = [];
    var optionalFields = [];
    var pageSize = [];
    var sortBy = [];
    parameters.relatedLists.forEach(relatedList => {
        relatedListIds.push(relatedList.relatedListId);
        if (relatedList.fields && relatedList.fields.length) {
            fields.push(relatedList.relatedListId + ':' + relatedList.fields.join());
        }
        if (relatedList.optionalFields && relatedList.optionalFields.length) {
            optionalFields.push(
                relatedList.relatedListId + ':' + relatedList.optionalFields.join()
            );
        }
        if (relatedList.pageSize) {
            pageSize.push(relatedList.relatedListId + ':' + relatedList.pageSize);
        }
        if (!!relatedList.sortBy && relatedList.sortBy.length) {
            sortBy.push(relatedList.relatedListId + ':' + relatedList.sortBy.join());
        }
    });
    const fieldsParam = fields.join(';');
    const optionalFieldsParam = optionalFields.join(';');
    const pageSizeParam = pageSize.join(';');
    const sortByParam = sortBy.join(';');

    return {
        parentRecordId: parameters.parentRecordId,
        relatedListIds: relatedListIds,
        fields: fieldsParam,
        optionalFields: optionalFieldsParam,
        pageSize: pageSizeParam,
        sortBy: sortByParam,
    };
}

function extractRelatedListsBatchParamsFromMockData(mockData) {
    if (mockData.results && mockData.results.length > 0) {
        const parentRecordId = mockData.results.find(item => item.result.listReference).result
            .listReference.inContextOfRecordId;
        const relatedLists = mockData.results
            .filter(result => result.result.listReference)
            .map(item => {
                return {
                    relatedListId: item.result.listReference.relatedListId,
                    fields: item.result.fields,
                    optionalFields: item.result.optionalFields,
                    pageSize: item.result.pageSize,
                    sortBy: item.result.sortBy,
                };
            });
        return {
            parentRecordId: parentRecordId,
            relatedLists: relatedLists,
        };
    } else {
        return {};
    }
}

export {
    // constants
    FormFactor,
    LayoutMode,
    LayoutType,
    MASTER_RECORD_TYPE_ID,
    URL_BASE,
    // cache expire utils
    expireActions,
    expireLayout,
    expireLayoutUserState,
    expireListUi,
    expireListInfo,
    expireLookupRecords,
    expirePicklistValues,
    expirePicklistValuesCollection,
    expireRecords,
    expireRecordUi,
    expireRecordAvatar,
    expireRecordDefaultsRepresentation,
    expireCloneTemplateRepresentation,
    expireCreateTemplateRepresentation,
    expireCreateRecordTemplateRepresentation,
    expireRelatedListInfo,
    expireObjectInfo,
    expireNavItems,
    expireDuplicateConfiguration,
    expireDuplicatesRepresentation,
    // network mock utils
    mockCreateRecordNetwork,
    mockDeleteRecordNetwork,
    mockGetAvatarsNetwork,
    mockGetLayoutNetwork,
    mockGetLayoutUserStateNetwork,
    mockGetListInfoByNameNetwork,
    mockGetObjectInfoNetwork,
    mockGetObjectInfosNetwork,
    mockGetPicklistValuesNetwork,
    mockGetRecordNetwork,
    mockGetRecordsNetwork,
    mockGetRecordActionsNetwork,
    mockGetGlobalActionsNetwork,
    mockGetRecordEditActionsNetwork,
    mockGetObjectCreateActionsNetwork,
    mockGetRecordCreateDefaultsNetwork,
    mockGetRecordTemplateCloneNetwork,
    mockGetRecordTemplateCreateNetwork,
    mockGetRecordUiNetwork,
    mockGetRelatedListActionsNetwork,
    mockGetRelatedListsActionsNetwork,
    mockGetRelatedListRecordNetwork,
    mockGetRelatedListRecordsNetwork,
    mockGetRelatedListRecordsBatchNetwork,
    mockUpdateRecordNetwork,
    mockUpdateLayoutUserStateNetwork,
    mockGetRelatedListInfoNetwork,
    mockGetRelatedListInfoBatchNetwork,
    mockGetNavItemsNetwork,
    mockGetDuplicatesConfigurationNetwork,
    mockGetDuplicatesNetwork,
    // mock data utils
    extractRecordFields,
    convertRelatedListsBatchParamsToResourceParams,
    extractRelatedListsBatchParamsFromMockData,
};
