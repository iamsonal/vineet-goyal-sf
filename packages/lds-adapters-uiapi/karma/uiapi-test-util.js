'use strict';

import { karmaNetworkAdapter } from 'lds';
import timekeeper from 'timekeeper';
import sinon from 'sinon';
import { mockNetworkOnce, mockNetworkSequence } from 'test-util';

import {
    FormFactor,
    LayoutMode,
    LayoutType,
    MASTER_RECORD_TYPE_ID,
    ACTIONS_TTL,
    LAYOUT_TTL,
    LAYOUT_USER_STATE_TTL,
    RECORD_TTL,
    RECORD_AVATAR_TTL,
    RECORD_DEFAULTS_REPRESENTATION_TTL,
    RECORD_UI_TTL,
    OBJECT_INFO_TTL,
    PICKLIST_VALUES_TTL,
    PICKLIST_VALUES_COLLECTION_TTL,
    RELATED_LIST_INFO_TTL,
} from './dist/uiapi-constants';

const API_VERSION = 'v49.0';
const URL_BASE = `/services/data/${API_VERSION}/ui-api`;

// FIXME: update to a real value once TTL is implemented
const LIST_UI_TTL = 60 * 1000;
const LOOKUP_RECORDS_TTL = 2 * 60 * 1000;

function mockCreateRecordNetwork(config, mockData) {
    const paramMatch = sinon.match({
        path: `${URL_BASE}/records`,
        method: 'post',
        body: config,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockDeleteRecordNetwork(recordId, mockData = {}) {
    const paramMatch = sinon.match({
        path: `${URL_BASE}/records/${recordId}`,
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
        path: `${URL_BASE}/record-avatars/batch/${recordIds.join(',')}`,
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
        path: `${URL_BASE}/layout/${objectApiName}`,
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
        path: `${URL_BASE}/layout/${objectApiName}/user-state`,
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
        path: `${URL_BASE}/records/${recordId}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRecordActionsNetwork(config, mockData) {
    const { recordIds, ...queryParams } = config;
    const path = `${URL_BASE}/actions/record/${recordIds.sort().join(',')}`;
    const paramMatch = sinon.match({
        path,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockGetRelatedListActionsNetwork(config, mockData) {
    const { recordIds, relatedListIds, ...queryParams } = config;
    const path = `${URL_BASE}/actions/record/${recordIds
        .sort()
        .join(',')}/related-list/${relatedListIds.sort().join(',')}`;
    const paramMatch = sinon.match({
        path,
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
        path: `${URL_BASE}/actions/record/${recordIds.sort().join(',')}/record-edit`,
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
        path: `${URL_BASE}/record-defaults/create/${objectApiName}`,
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
        path: `${URL_BASE}/record-ui/${recordIds}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockUpdateRecordNetwork(recordId, updateParams, mockData, headers) {
    const paramMatch = sinon.match({
        path: `${URL_BASE}/records/${recordId}`,
        method: 'patch',
        body: updateParams,
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
        path: `${URL_BASE}/layout/${objectApiName}/user-state`,
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
        path: `${URL_BASE}/actions/record/${recordIds
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

function mockGetObjectInfoNetwork(config, mockData) {
    let { objectApiName, ...queryParams } = config;

    if (typeof objectApiName !== 'string') {
        objectApiName = objectApiName.objectApiName;
    }

    const paramMatch = sinon.match({
        path: `${URL_BASE}/object-info/${objectApiName}`,
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
        path: `${URL_BASE}/object-info/batch/${objectApiNames}`,
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

    let path =
        fieldApiName === undefined
            ? `${URL_BASE}/object-info/${objectApiName}/picklist-values/${recordTypeId}`
            : `${URL_BASE}/object-info/${objectApiName}/picklist-values/${recordTypeId}/${fieldApiName}`;

    const paramMatch = sinon.match({ path });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
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
    const fields = extractRecordFieldsAtPath(path);

    if (options && options.omit) {
        return fields.filter(name => options.omit.indexOf(name) === -1);
    }

    return fields;
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
    expireLookupRecords,
    expirePicklistValues,
    expirePicklistValuesCollection,
    expireRecords,
    expireRecordUi,
    expireRecordAvatar,
    expireRecordDefaultsRepresentation,
    expireRelatedListInfo,
    expireObjectInfo,
    // network mock utils
    mockCreateRecordNetwork,
    mockDeleteRecordNetwork,
    mockGetAvatarsNetwork,
    mockGetLayoutNetwork,
    mockGetLayoutUserStateNetwork,
    mockGetObjectInfoNetwork,
    mockGetObjectInfosNetwork,
    mockGetPicklistValuesNetwork,
    mockGetRecordNetwork,
    mockGetRecordActionsNetwork,
    mockGetRecordEditActionsNetwork,
    mockGetRecordCreateDefaultsNetwork,
    mockGetRecordUiNetwork,
    mockGetRelatedListActionsNetwork,
    mockGetRelatedListRecordNetwork,
    mockUpdateRecordNetwork,
    mockUpdateLayoutUserStateNetwork,
    // mock data utils
    extractRecordFields,
};
