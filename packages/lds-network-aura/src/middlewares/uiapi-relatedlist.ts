import type { ResourceRequest } from '@luvio/engine';
import type { RelatedListRecordCollectionRepresentation } from '@salesforce/lds-adapters-uiapi';
import type { RelatedListRecordCollectionBatchRepresentation } from '@salesforce/lds-adapters-uiapi';
import { UI_API_BASE_URI } from './uiapi-base';
import type { InstrumentationRejectConfig, InstrumentationResolveConfig } from './utils';
import { buildUiApiParams, dispatchAction } from './utils';
import appRouter from '../router';
import type { RelatedListInstrumentationCallbacks } from './event-logging';
import { CrudEventState, CrudEventType, forceRecordTransactionsDisabled } from './event-logging';
import { instrumentation } from '../instrumentation';

enum UiApiRecordController {
    GetRelatedListInfo = 'RelatedListUiController.getRelatedListInfoByApiName',
    UpdateRelatedListInfo = 'RelatedListUiController.updateRelatedListInfoByApiName',
    GetRelatedListsInfo = 'RelatedListUiController.getRelatedListInfoCollection',
    GetRelatedListRecords = 'RelatedListUiController.getRelatedListRecords',
    GetRelatedListCount = 'RelatedListUiController.getRelatedListRecordCount',
    GetRelatedListCounts = 'RelatedListUiController.getRelatedListsRecordCount',
    GetRelatedListInfoBatch = 'RelatedListUiController.getRelatedListInfoBatch',
    GetRelatedListPreferences = 'RelatedListUiController.getRelatedListPreferences',
    UpdateRelatedListPreferences = 'RelatedListUiController.updateRelatedListPreferences',
    GetRelatedListPreferencesBatch = 'RelatedListUiController.getRelatedListPreferencesBatch',
    PostRelatedListRecordsBatch = 'RelatedListUiController.postRelatedListRecordsBatch',
}

const UIAPI_RELATED_LIST_INFO_PATH = `${UI_API_BASE_URI}/related-list-info`;
const UIAPI_RELATED_LIST_INFO_BATCH_PATH = `${UI_API_BASE_URI}/related-list-info/batch`;
const UIAPI_RELATED_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/related-list-records`;
const UIAPI_RELATED_LIST_RECORDS_BATCH_PATH = `${UI_API_BASE_URI}/related-list-records/batch`;
const UIAPI_RELATED_LIST_COUNT_PATH = `${UI_API_BASE_URI}/related-list-count`;
const UIAPI_RELATED_LIST_PREFERENCES_PATH = `${UI_API_BASE_URI}/related-list-preferences`;
const UIAPI_RELATED_LIST_PREFERENCES_BATCH_PATH = `${UI_API_BASE_URI}/related-list-preferences/batch`;

let crudInstrumentationCallbacks: RelatedListInstrumentationCallbacks | null = null;

if (forceRecordTransactionsDisabled === false) {
    crudInstrumentationCallbacks = {
        getRelatedListRecordsRejectFunction: (config: InstrumentationRejectConfig) => {
            instrumentation.logCrud(CrudEventType.READS, {
                parentRecordId: config.params.parentRecordId,
                relatedListId: config.params.relatedListId,
                state: CrudEventState.ERROR,
            });
        },
        getRelatedListRecordsResolveFunction: (config: InstrumentationResolveConfig) => {
            logGetRelatedListRecordsInteraction(
                config.body as RelatedListRecordCollectionRepresentation
            );
        },
        getRelatedListRecordsBatchRejectFunction: (config: InstrumentationRejectConfig) => {
            instrumentation.logCrud(CrudEventType.READS, {
                parentRecordId: config.params.parentRecordId,
                relatedListIds: config.params.listRecordsQuery.relatedListParameters.map(
                    (entry: { relatedListId: any }) => entry.relatedListId
                ),
                state: CrudEventState.ERROR,
            });
        },
        getRelatedListRecordsBatchResolveFunction: (config: InstrumentationResolveConfig) => {
            (config.body as RelatedListRecordCollectionBatchRepresentation).results.forEach(
                (res) => {
                    // Log for each RL that was returned from batch endpoint
                    if (res.statusCode === 200) {
                        logGetRelatedListRecordsInteraction(res.result);
                    }
                }
            );
        },
    };
}

function getRelatedListInfo(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            relatedListId: urlParams.relatedListId,
            recordTypeId: queryParams.recordTypeId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListInfo, params);
}

function updateRelatedListInfo(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams, body } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            relatedListId: urlParams.relatedListId,
            recordTypeId: queryParams.recordTypeId,
            relatedListInfoInput: {
                orderedByInfo: body.orderedByInfo,
                userPreferences: body.userPreferences,
            },
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.UpdateRelatedListInfo, params);
}

function getRelatedListsInfo(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            recordTypeId: queryParams.recordTypeId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListsInfo, params);
}

function getRelatedListRecords(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { parentRecordId, relatedListId },
        queryParams: { fields, optionalFields, pageSize, pageToken, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: parentRecordId,
            relatedListId: relatedListId,
            fields,
            optionalFields,
            pageSize,
            pageToken,
            sortBy,
        },
        resourceRequest
    );

    const instrumentationCallbacks =
        crudInstrumentationCallbacks !== null
            ? {
                  rejectFn: crudInstrumentationCallbacks.getRelatedListRecordsRejectFunction,
                  resolveFn: crudInstrumentationCallbacks.getRelatedListRecordsResolveFunction,
              }
            : {};

    return dispatchAction(
        UiApiRecordController.GetRelatedListRecords,
        params,
        undefined,
        instrumentationCallbacks
    );
}

function postRelatedListRecordsBatch(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { parentRecordId },
        body,
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: parentRecordId,
            listRecordsQuery: body,
        },
        resourceRequest
    );

    const instrumentationCallbacks =
        crudInstrumentationCallbacks !== null
            ? {
                  rejectFn: crudInstrumentationCallbacks.getRelatedListRecordsBatchRejectFunction,
                  resolveFn: crudInstrumentationCallbacks.getRelatedListRecordsBatchResolveFunction,
              }
            : {};

    return dispatchAction(
        UiApiRecordController.PostRelatedListRecordsBatch,
        params,
        undefined,
        instrumentationCallbacks
    );
}

function getRelatedListCount(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: urlParams.parentRecordId,
            relatedListId: urlParams.relatedListId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListCount, params);
}

function getRelatedListsCount(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: urlParams.parentRecordId,
            relatedListNames: urlParams.relatedListNames,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListCounts, params);
}

function getRelatedListInfoBatch(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentObjectApiName: urlParams.parentObjectApiName,
            relatedListNames: urlParams.relatedListNames,
            recordTypeId: queryParams.recordTypeId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListInfoBatch, params);
}

function getRelatedListPreferences(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            preferencesId: urlParams.preferencesId,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListPreferences, params);
}

function updateRelatedListPreferences(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, body } = resourceRequest;

    const params = buildUiApiParams(
        {
            preferencesId: urlParams.preferencesId,
            relatedListUserPreferencesInput: {
                columnWidths: body.columnWidths,
                columnWrap: body.columnWrap,
                orderedBy: body.orderedBy,
            },
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.UpdateRelatedListPreferences, params);
}

function getRelatedListPreferencesBatch(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            preferencesIds: urlParams.preferencesIds,
        },
        resourceRequest
    );

    return dispatchAction(UiApiRecordController.GetRelatedListPreferencesBatch, params);
}

appRouter.patch(
    (path: string) => path.startsWith(UIAPI_RELATED_LIST_INFO_PATH),
    updateRelatedListInfo
);
// related-list-info/batch/API_NAME/RELATED_LIST_IDS
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_INFO_BATCH_PATH) &&
        /related-list-info\/batch\/[a-zA-Z_\d]+\/[a-zA-Z_\d]+/.test(path),
    getRelatedListInfoBatch
);
// related-list-info/API_NAME/RELATED_LIST_ID
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_INFO_PATH) &&
        /related-list-info\/[a-zA-Z_\d]+\/[a-zA-Z_\d]+/.test(path),
    getRelatedListInfo
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_INFO_PATH) &&
        /related-list-info\/[a-zA-Z_\d]+\/[a-zA-Z_\d]+/.test(path) === false,
    getRelatedListsInfo
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_RECORDS_PATH) &&
        path.startsWith(UIAPI_RELATED_LIST_RECORDS_BATCH_PATH) === false,
    getRelatedListRecords
);
appRouter.post(
    (path: string) => path.startsWith(UIAPI_RELATED_LIST_RECORDS_BATCH_PATH),
    postRelatedListRecordsBatch
);
// related-list-count/batch/parentRecordId/relatedListNames
appRouter.get(
    (path: string) => path.startsWith(UIAPI_RELATED_LIST_COUNT_PATH + '/batch'),
    getRelatedListsCount
);
// related-list-count/parentRecordId/relatedListName
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_COUNT_PATH) &&
        path.startsWith(UIAPI_RELATED_LIST_COUNT_PATH + '/batch') === false,
    getRelatedListCount
);

// related-list-preferences/preferencesId
appRouter.patch(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_PREFERENCES_PATH) &&
        path.startsWith(UIAPI_RELATED_LIST_PREFERENCES_BATCH_PATH) === false,
    updateRelatedListPreferences
);
appRouter.get(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_PREFERENCES_PATH) &&
        path.startsWith(UIAPI_RELATED_LIST_PREFERENCES_BATCH_PATH) === false,
    getRelatedListPreferences
);

// related-list-preferences/batch/preferencesIds
appRouter.get(
    (path: string) => path.startsWith(UIAPI_RELATED_LIST_PREFERENCES_BATCH_PATH),
    getRelatedListPreferencesBatch
);

function logGetRelatedListRecordsInteraction(
    body: RelatedListRecordCollectionRepresentation
): void {
    const records = body.records;
    // Don't log anything if the related list has no records.
    if (records.length === 0) {
        return;
    }

    const recordIds = records.map((record) => {
        return record.id;
    });

    /**
     *  In almost every case - the relatedList records will all be of the same apiName, but there is an edge case for
        Activities entity that could return Events & Tasks- so handle that case by returning a joined string.
        ADS Implementation only looks at the first record returned to determine the apiName.
        See force/recordLibrary/recordMetricsPlugin.js _getRecordType method.
     */
    instrumentation.logCrud(CrudEventType.READS, {
        parentRecordId: body.listReference.inContextOfRecordId,
        relatedListId: body.listReference.relatedListId,
        recordIds,
        recordType: body.records[0].apiName,
        state: CrudEventState.SUCCESS,
    });
}
