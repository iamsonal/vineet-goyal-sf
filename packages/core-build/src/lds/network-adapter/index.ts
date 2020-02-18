import { ResourceRequest } from '@ldsjs/engine';

import { ArrayPrototypePush, JSONParse, JSONStringify, ObjectEntries } from '../../utils/language';

import { ControllerInvoker } from './middlewares/utils';
import { APEX_BASE_URI, executeApex } from './middlewares/apex';
import {
    getLookupActions,
    getRecordActions,
    getRecordEditActions,
    getRelatedListActions,
    getRelatedListRecordActions,
    UIAPI_ACTIONS_LOOKUP_PATH,
    UIAPI_ACTIONS_RECORD_EDIT,
    UIAPI_ACTIONS_RECORD_PATH,
    UIAPI_ACTIONS_RELATED_LIST,
    UIAPI_ACTIONS_RELATED_LIST_RECORD,
} from './middlewares/uiapi-actions';
import {
    getListRecordsById,
    getListRecordsByName,
    getListsByObjectName,
    getListUiById,
    getListUiByName,
    UIAPI_LIST_RECORDS_PATH,
    UIAPI_LIST_UI_PATH,
} from './middlewares/uiapi-lists';
import { lookupRecords, UIAPI_LOOKUP_RECORDS } from './middlewares/uiapi-lookup';
import {
    getMruListRecords,
    getMruListUi,
    UIAPI_MRU_LIST_RECORDS_PATH,
    UIAPI_MRU_LIST_UI_PATH,
} from './middlewares/uiapi-mrulists';
import {
    createRecord,
    deleteRecord,
    getLayout,
    getLayoutUserState,
    getObjectInfo,
    getObjectInfos,
    getPicklistValues,
    getPicklistValuesByRecordType,
    getRecord,
    getRecordAvatars,
    getRecordCreateDefaults,
    getRecordUi,
    UIAPI_GET_LAYOUT,
    UIAPI_GET_LAYOUT_USER_STATE,
    UIAPI_OBJECT_INFO_PATH,
    UIAPI_OBJECT_INFO_BATCH_PATH,
    UIAPI_RECORDS_PATH,
    UIAPI_RECORD_AVATARS_BASE,
    UIAPI_RECORD_AVATARS_BATCH_PATH,
    UIAPI_RECORD_AVATAR_UPDATE,
    UIAPI_RECORD_CREATE_DEFAULTS_PATH,
    UIAPI_RECORD_UI_PATH,
    updateRecord,
    updateLayoutUserState,
    updateRecordAvatar,
} from './middlewares/uiapi-records';
import {
    getRelatedListInfo,
    updateRelatedListInfo,
    getRelatedListsInfo,
    getRelatedListRecords,
    getRelatedListCount,
    getRelatedListsCount,
    UIAPI_RELATED_LIST_INFO_PATH,
    UIAPI_RELATED_LIST_RECORDS_PATH,
    UIAPI_RELATED_LIST_COUNT_PATH,
} from './middlewares/uiapi-relatedlist';

interface RequestHandlers {
    resolve: (response: any) => void;
    reject: (error: Error) => void;
}

function controllerInvokerFactory(resourceRequest: ResourceRequest): ControllerInvoker {
    const { path, method } = resourceRequest;

    switch (method) {
        case 'delete':
            if (path.startsWith(UIAPI_RECORDS_PATH)) {
                return deleteRecord;
            }
            break;
        case 'post':
            if (path === UIAPI_RECORDS_PATH) {
                return createRecord;
            }
            if (path === APEX_BASE_URI) {
                return executeApex;
            }
            if (path.startsWith(UIAPI_RECORD_AVATARS_BASE)) {
                if (path.endsWith(UIAPI_RECORD_AVATAR_UPDATE)) {
                    return updateRecordAvatar;
                }
            }
            break;
        case 'patch':
            if (path.startsWith(UIAPI_RECORDS_PATH)) {
                return updateRecord;
            }
            if (path.startsWith(UIAPI_GET_LAYOUT)) {
                if (path.endsWith(UIAPI_GET_LAYOUT_USER_STATE)) {
                    return updateLayoutUserState;
                }
            }
            if (path.startsWith(UIAPI_RELATED_LIST_INFO_PATH)) {
                return updateRelatedListInfo;
            }
            break;
        case 'get':
            if (path.startsWith(UIAPI_ACTIONS_LOOKUP_PATH)) {
                return getLookupActions;
            }

            if (path.startsWith(UIAPI_ACTIONS_RECORD_PATH)) {
                if (path.endsWith(UIAPI_ACTIONS_RECORD_EDIT)) {
                    return getRecordEditActions;
                } else if (path.indexOf(UIAPI_ACTIONS_RELATED_LIST_RECORD) > 0) {
                    return getRelatedListRecordActions;
                } else if (path.indexOf(UIAPI_ACTIONS_RELATED_LIST) > 0) {
                    return getRelatedListActions;
                } else {
                    return getRecordActions;
                }
            }

            if (path.startsWith(UIAPI_LIST_RECORDS_PATH)) {
                if (/list-records\/.*\//.test(path)) {
                    // .../list-records/${objectApiName}/${listViewApiName}
                    return getListRecordsByName;
                } else {
                    // .../list-records/${listViewId}
                    return getListRecordsById;
                }
            }

            if (path.startsWith(UIAPI_LIST_UI_PATH)) {
                if (/list-ui\/.*\//.test(path)) {
                    // .../list-ui/${objectApiName}/${listViewApiName}
                    return getListUiByName;
                } else if (/00B[a-zA-Z\d]{15}$/.test(path)) {
                    // .../list-ui/${listViewId}
                    return getListUiById;
                } else {
                    // .../list-ui/${objectApiName}
                    return getListsByObjectName;
                }
            }

            if (path.startsWith(UIAPI_MRU_LIST_RECORDS_PATH)) {
                return getMruListRecords;
            }

            if (path.startsWith(UIAPI_MRU_LIST_UI_PATH)) {
                return getMruListUi;
            }

            if (path.startsWith(UIAPI_OBJECT_INFO_PATH)) {
                if (path.startsWith(UIAPI_OBJECT_INFO_BATCH_PATH)) {
                    // object-info/batch/
                    return getObjectInfos;
                } else if (/picklist-values\/[a-zA-Z\d]+\/[a-zA-Z\d]+/.test(path)) {
                    // object-info/API_NAME/picklist-values/RECORD_TYPE_ID/FIELD_API_NAME
                    return getPicklistValues;
                } else if (/picklist-values\/[a-zA-Z\d]+/.test(path)) {
                    // object-info/API_NAME/picklist-values/RECORD_TYPE_ID
                    return getPicklistValuesByRecordType;
                }

                return getObjectInfo;
            }

            if (path.startsWith(UIAPI_RECORDS_PATH)) {
                return getRecord;
            }

            if (path.startsWith(UIAPI_RECORD_CREATE_DEFAULTS_PATH)) {
                return getRecordCreateDefaults;
            }

            if (path.startsWith(UIAPI_RECORD_AVATARS_BATCH_PATH)) {
                return getRecordAvatars;
            }

            if (path.startsWith(UIAPI_RECORD_UI_PATH)) {
                return getRecordUi;
            }

            if (path.startsWith(UIAPI_LOOKUP_RECORDS)) {
                return lookupRecords;
            }

            if (path.startsWith(UIAPI_GET_LAYOUT)) {
                if (path.endsWith(UIAPI_GET_LAYOUT_USER_STATE)) {
                    return getLayoutUserState;
                }
                return getLayout;
            }

            if (path.startsWith(UIAPI_RELATED_LIST_INFO_PATH)) {
                // related-list-info/API_NAME/RELATED_LIST_ID
                if (/related-list-info\/[a-zA-Z_\d]+\/[a-zA-Z_\d]+/.test(path)) {
                    return getRelatedListInfo;
                }
                return getRelatedListsInfo;
            }

            if (path.startsWith(UIAPI_RELATED_LIST_RECORDS_PATH)) {
                return getRelatedListRecords;
            }

            if (path.startsWith(UIAPI_RELATED_LIST_COUNT_PATH)) {
                // related-list-count/batch/parentRecordId/relatedListNames
                if (path.startsWith(UIAPI_RELATED_LIST_COUNT_PATH + '/batch')) {
                    return getRelatedListsCount;
                }
                // related-list-count/parentRecordId/relatedListName
                return getRelatedListCount;
            }

            break;
    }

    throw new Error(`No invoker matching controller factory: ${path} ${method}.`);
}

interface RequestHandlers {
    resolve: (response: any) => void;
    reject: (error: Error) => void;
    resourceRequest: ResourceRequest;
}
interface InflightRequests {
    [key: string]: RequestHandlers[];
}

function getFulfillingRequest(
    inflightRequests: InflightRequests,
    resourceRequest: ResourceRequest
): string | null {
    const { fulfill } = resourceRequest;
    if (fulfill === undefined) {
        return null;
    }

    const handlersMap = ObjectEntries(inflightRequests);
    for (let i = 0, len = handlersMap.length; i < len; i += 1) {
        const [transactionKey, handlers] = handlersMap[i];
        // check fulfillment against only the first handler ([0]) because it's equal or
        // fulfills all subsequent handlers in the array
        const existing = handlers[0].resourceRequest;
        if (fulfill(existing, resourceRequest) === true) {
            return transactionKey;
        }
    }
    return null;
}

function getTransactionKey(resourceRequest: ResourceRequest): string {
    const { path, key, queryParams, headers } = resourceRequest;
    return `${path}::${JSONStringify(headers)}::${
        queryParams ? JSONStringify(queryParams) : ''
    }::${key}`;
}

const inflightRequests: InflightRequests = Object.create(null);

export default function networkAdapter(resourceRequest: ResourceRequest): Promise<any> {
    const { method } = resourceRequest;

    const transactionKey = getTransactionKey(resourceRequest);
    const controllerInvoker = controllerInvokerFactory(resourceRequest);

    if (method !== 'get') {
        return controllerInvoker(resourceRequest, transactionKey);
    }

    // if an identical request is in-flight then queue for its response (do not re-issue the request)
    if (transactionKey in inflightRequests) {
        return new Promise((resolve, reject) => {
            ArrayPrototypePush.call(inflightRequests[transactionKey], {
                resolve,
                reject,
                resourceRequest,
            });
        });
    }

    // fallback to checking a custom deduper to find a similar (but not identical) request
    const similarTransactionKey = getFulfillingRequest(inflightRequests, resourceRequest);
    if (similarTransactionKey !== null) {
        return new Promise(resolve => {
            // custom dedupers find similar (not identical) requests. if the similar request fails
            // there's no guarantee the deduped request should fail. thus we re-issue the
            // original request in the case of a failure
            function reissueRequest() {
                resolve(networkAdapter(resourceRequest));
            }
            ArrayPrototypePush.call(inflightRequests[similarTransactionKey], {
                resolve,
                reject: reissueRequest,
                resourceRequest,
            });
        });
    }

    // not a duplicate request so invoke the network
    // when it resolves, clear the queue then invoke queued handlers
    // (must clear the queue first in case handlers re-invoke the network)
    controllerInvoker(resourceRequest, transactionKey).then(
        response => {
            const handlers = inflightRequests[transactionKey];
            delete inflightRequests[transactionKey];
            // handlers mutate responses so must clone the response for each.
            // the first handler is given the original version to avoid an
            // extra clone (particularly when there's only 1 handler).
            for (let i = 1, len = handlers.length; i < len; i++) {
                const handler = handlers[i];
                handler.resolve(JSONParse(JSONStringify(response)));
            }
            handlers[0].resolve(response);
        },
        error => {
            const handlers = inflightRequests[transactionKey];
            delete inflightRequests[transactionKey];
            for (let i = 0, len = handlers.length; i < len; i++) {
                const handler = handlers[i];
                handler.reject(error);
            }
        }
    );

    // rely on sync behavior of Promise creation to create the list for handlers
    return new Promise((resolve, reject) => {
        inflightRequests[transactionKey] = [{ resolve, reject, resourceRequest }];
    });
}
