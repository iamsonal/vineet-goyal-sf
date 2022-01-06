import { ResourceRequest } from '@luvio/engine';
import { RelatedListRecordCollectionRepresentation } from '@salesforce/lds-adapters-uiapi';
import { RelatedListRecordCollectionBatchRepresentation } from '@salesforce/lds-adapters-uiapi';
import { UI_API_BASE_URI } from './uiapi-base';
import {
    buildUiApiParams,
    dispatchAction,
    InstrumentationRejectConfig,
    InstrumentationResolveConfig,
} from './utils';
import appRouter from '../router';
import {
    CrudEventState,
    CrudEventType,
    forceRecordTransactionsDisabled,
    RelatedListInstrumentationCallbacks,
} from './event-logging';
import { instrumentation } from '../instrumentation';

enum UiApiRecordController {
    GetRelatedListInfo = 'RelatedListUiController.getRelatedListInfoByApiName',
    UpdateRelatedListInfo = 'RelatedListUiController.updateRelatedListInfoByApiName',
    GetRelatedListsInfo = 'RelatedListUiController.getRelatedListInfoCollection',
    PostRelatedListRecords = 'RelatedListUiController.postRelatedListRecords',
    GetRelatedListCount = 'RelatedListUiController.getRelatedListRecordCount',
    GetRelatedListCounts = 'RelatedListUiController.getRelatedListsRecordCount',
    GetRelatedListInfoBatch = 'RelatedListUiController.getRelatedListInfoBatch',
    GetRelatedListRecordsBatch = 'RelatedListUiController.getRelatedListRecordsBatch',
}

const UIAPI_RELATED_LIST_INFO_PATH = `${UI_API_BASE_URI}/related-list-info`;
const UIAPI_RELATED_LIST_INFO_BATCH_PATH = `${UI_API_BASE_URI}/related-list-info/batch`;
const UIAPI_RELATED_LIST_RECORDS_PATH = `${UI_API_BASE_URI}/related-list-records`;
const UIAPI_RELATED_LIST_RECORDS_BATCH_PATH = `${UI_API_BASE_URI}/related-list-records/batch`;
const UIAPI_RELATED_LIST_COUNT_PATH = `${UI_API_BASE_URI}/related-list-count`;

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
                relatedListIds: config.params.relatedListIds,
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

function postRelatedListRecords(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { parentRecordId, relatedListId },
        body,
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: parentRecordId,
            relatedListId: relatedListId,
            listRecordsQuery: body,
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
        UiApiRecordController.PostRelatedListRecords,
        params,
        undefined,
        instrumentationCallbacks
    );
}

function getRelatedListRecordsBatch(resourceRequest: ResourceRequest): Promise<any> {
    const {
        urlParams: { parentRecordId, relatedListIds },
        queryParams: { fields, optionalFields, pageSize, sortBy },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            parentRecordId: parentRecordId,
            relatedListIds: relatedListIds,
            fields,
            optionalFields,
            pageSize,
            sortBy,
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
        UiApiRecordController.GetRelatedListRecordsBatch,
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
appRouter.post(
    (path: string) =>
        path.startsWith(UIAPI_RELATED_LIST_RECORDS_PATH) &&
        path.startsWith(UIAPI_RELATED_LIST_RECORDS_BATCH_PATH) === false,
    postRelatedListRecords
);
appRouter.get(
    (path: string) => path.startsWith(UIAPI_RELATED_LIST_RECORDS_BATCH_PATH),
    getRelatedListRecordsBatch
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
