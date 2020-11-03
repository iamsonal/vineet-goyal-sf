import { NetworkAdapter, ResourceRequest } from '@ldsjs/engine';
import { ResponsePropertyRetriever, RetrievedProperty } from '@ldsjs/environments';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { DraftAction, DraftQueue } from './main';
import { ObjectKeys } from './utils/language';
import { replayDraftsOnRecord } from './utils/records';

/**
 * Applys drafts to records in a network response
 * @param records references to records in the response
 * @param draftQueue the draft queue
 */
function applyDraftsToResponse(
    records: RetrievedProperty<RecordRepresentation>[],
    draftQueue: DraftQueue
) {
    const { length: retrievedRecordsLength } = records;
    const retrievedRecordKeys: { [key: string]: true } = {};

    for (let j = 0, len = retrievedRecordsLength; j < len; j++) {
        const { cacheKey } = records[j];
        retrievedRecordKeys[cacheKey] = true;
    }

    return draftQueue.getActionsForTags(retrievedRecordKeys).then(actions => {
        const retrievedKeys = ObjectKeys(retrievedRecordKeys);
        for (let j = 0, len = retrievedKeys.length; j < len; j++) {
            const { cacheKey, data } = records[j];
            const drafts = actions[cacheKey] as Readonly<DraftAction<RecordRepresentation>[]>;

            if (drafts !== undefined && drafts.length > 0) {
                records[j].data = replayDraftsOnRecord(data, [...drafts]);
            }
        }
    });
}

export function makeNetworkAdapterDraftAware(
    networkAdapter: NetworkAdapter,
    draftQueue: DraftQueue,
    recordResponseRetrievers: ResponsePropertyRetriever<unknown, RecordRepresentation>[] = []
): NetworkAdapter {
    return (request: ResourceRequest) => {
        return networkAdapter(request).then(response => {
            for (let i = 0, len = recordResponseRetrievers.length; i < len; i++) {
                const { canRetrieve, retrieve } = recordResponseRetrievers[i];
                if (!canRetrieve(request)) {
                    continue;
                }
                // use the first retriever that can handle this response
                const responseRecords = retrieve(response);
                const { length: retrievedRecordsLength } = responseRecords;

                if (retrievedRecordsLength === 0) {
                    return response;
                }

                return applyDraftsToResponse(responseRecords, draftQueue).then(() => {
                    return response;
                });
            }

            return response;
        });
    };
}
