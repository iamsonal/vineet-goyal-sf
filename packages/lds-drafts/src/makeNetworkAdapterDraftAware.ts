import { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { ResponsePropertyRetriever, RetrievedProperty } from '@luvio/environments';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { DraftAction, DraftQueue } from './main';
import { replayDraftsOnRecord } from './utils/records';

/**
 * Applies drafts to records in a network response
 * @param records references to records in the response
 * @param draftQueue the draft queue
 * @param userId the current user id
 */
function applyDraftsToResponse(
    records: RetrievedProperty<RecordRepresentation>[],
    draftQueue: DraftQueue,
    userId: string
) {
    const { length: retrievedRecordsLength } = records;
    const retrievedRecordKeys: { [key: string]: true } = {};

    for (let j = 0; j < retrievedRecordsLength; j++) {
        const { cacheKey } = records[j];
        retrievedRecordKeys[cacheKey] = true;
    }

    return draftQueue.getActionsForTags(retrievedRecordKeys).then((actions) => {
        // even though some might be duplicate record IDs, we have to loop through
        // each record because it sits at a different spot in memory
        for (let j = 0; j < retrievedRecordsLength; j++) {
            const { cacheKey, data } = records[j];
            const drafts = actions[cacheKey] as Readonly<DraftAction<RecordRepresentation>[]>;

            if (drafts !== undefined && drafts.length > 0) {
                records[j].data = replayDraftsOnRecord(data, [...drafts], userId);
            }
        }
    });
}

export function draftAwareHandleResponse(
    request: ResourceRequest,
    response: FetchResponse<any>,
    draftQueue: DraftQueue,
    recordResponseRetrievers: ResponsePropertyRetriever<unknown, RecordRepresentation>[],
    userId: string
): Promise<FetchResponse<any>> {
    for (let i = 0, len = recordResponseRetrievers.length; i < len; i++) {
        const { canRetrieve, retrieve } = recordResponseRetrievers[i];
        if (!canRetrieve(request)) {
            continue;
        }
        // use the first retriever that can handle this response
        const responseRecords = retrieve(response);
        const { length: retrievedRecordsLength } = responseRecords;

        if (retrievedRecordsLength === 0) {
            return Promise.resolve(response);
        }

        return applyDraftsToResponse(responseRecords, draftQueue, userId).then(() => {
            return response;
        });
    }

    return Promise.resolve(response);
}

export function makeNetworkAdapterDraftAware(
    networkAdapter: NetworkAdapter,
    draftQueue: DraftQueue,
    recordResponseRetrievers: ResponsePropertyRetriever<unknown, RecordRepresentation>[] = [],
    userId: string
): NetworkAdapter {
    return (request: ResourceRequest) => {
        return networkAdapter(request).then((response) => {
            return draftAwareHandleResponse(
                request,
                response,
                draftQueue,
                recordResponseRetrievers,
                userId
            );
        });
    };
}
