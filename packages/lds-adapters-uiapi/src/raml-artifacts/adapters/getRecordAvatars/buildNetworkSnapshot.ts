import {
    FetchResponse,
    Luvio,
    Snapshot,
    ResourceRequestOverride,
    ResourceResponse,
} from '@luvio/engine';
import { ArrayPrototypeReduce } from '../../../util/language';
import { ingest as recordAvatarBulkMapRepresentationIngest } from '../../types/RecordAvatarBulkMapRepresentation/ingest';
import {
    createResourceParams,
    onResourceResponseSuccess,
    onResourceResponseError,
} from '../../../generated/adapters/getRecordAvatars';
import { RecordAvatarBulkMapRepresentation } from '../../../generated/types/RecordAvatarBulkMapRepresentation';
import { RecordAvatarBulkRepresentation } from '../../../generated/types/RecordAvatarBulkRepresentation';
import {
    createResourceRequest,
    getResponseCacheKeys,
} from '../../../generated/resources/getUiApiRecordAvatarsBatchByRecordIds';
import { RecordAvatarBatchRepresentation } from '../../../generated/types/RecordAvatarBatchRepresentation';
import { KEY, GetRecordAvatarsConfig } from './utils';
import { buildInMemorySnapshot } from './buildInMemorySnapshot';

// Track in-flight xrequests so we known when to send out our fake response
export const IN_FLIGHT_REQUESTS = new Set<string>();

export function getRecordIdsFlightStatus(
    recordIds: string[],
    in_flight_requests: Set<string>
): { recordIdsInFlight: string[]; recordIdsNotInFlight: string[] } {
    const recordIdsNotInFlight: string[] = [],
        recordIdsInFlight: string[] = [];

    // Split up the given record ids into in flight ids and not in flight ids
    recordIds.forEach((id) => {
        if (in_flight_requests.has(id)) {
            recordIdsInFlight.push(id);
        } else {
            recordIdsNotInFlight.push(id);
        }
    });

    return {
        recordIdsInFlight: recordIdsInFlight,
        recordIdsNotInFlight: recordIdsNotInFlight,
    };
}

/**
 * TODO [W-8318817]: For 230/232 this is a workaround to not having inflight
 * deduping for record avatars.
 * The way it works is we ingest a fake response while the real response is pending.
 * So for example a component wires record avatars for ABC, while that request is in flight
 * another component wires record avatars AB. The wire for ABC will send off a request for data
 * Then AB comes in and will resolve the fake response instead of sending off a request.
 * Then once the real response comes back it will be ingested and it will notify both AB and ABC.
 * We will resolve this in 234 using real inflight deduping
 */
function ingestFakeResponse(luvio: Luvio, recordIds: string[]) {
    const formatted = ArrayPrototypeReduce.call(
        recordIds,
        (accum: any, recordId) => {
            accum[recordId] = {
                statusCode: 200,
                result: {
                    backgroundColor: null,
                    eTag: '',
                    height: null,
                    photoMetadata: { companyBluemasterId: null, responseId: null },
                    photoUrl: '',
                    provider: null,
                    recordId: '',
                    type: 'Photo',
                    width: null,
                },
            } as RecordAvatarBatchRepresentation;
            return accum;
        },
        {}
    ) as RecordAvatarBulkMapRepresentation;

    luvio.storeIngest<RecordAvatarBulkMapRepresentation>(
        KEY,
        recordAvatarBulkMapRepresentationIngest,
        formatted
    );
}

function isRecordAvatarBulkMapRepresentation(
    response: ResourceResponse<RecordAvatarBulkRepresentation | RecordAvatarBulkMapRepresentation>
): response is ResourceResponse<RecordAvatarBulkMapRepresentation> {
    return (response.body as any).hasErrors === undefined;
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetRecordAvatarsConfig,
    override?: ResourceRequestOverride
): Promise<Snapshot<RecordAvatarBulkMapRepresentation, any>> {
    const { uncachedRecordIds, recordIds } = config;
    const { recordIdsInFlight, recordIdsNotInFlight } = getRecordIdsFlightStatus(
        uncachedRecordIds || recordIds, // If uncached records were specified, only get those, otherwise, get all of them
        IN_FLIGHT_REQUESTS
    );

    // For any remaining record ids send off the real request and add it to the in flight request list
    let luvioResponse;
    if (recordIdsNotInFlight.length > 0) {
        recordIdsNotInFlight.forEach((id) => IN_FLIGHT_REQUESTS.add(id));
        const resourceParams = createResourceParams({ ...config, recordIds: recordIdsNotInFlight });
        const request = createResourceRequest(resourceParams);
        luvioResponse = luvio
            .dispatchResourceRequest<RecordAvatarBulkMapRepresentation>(request, override)
            .then(
                (response) => {
                    recordIdsNotInFlight.forEach((id) => IN_FLIGHT_REQUESTS.delete(id));
                    // the selector passed to dispatchResourceRequest requests the data already formatted so the response
                    // can either be a RecordAvatarBulkRepresentation or a RecordAvatarBulkMapRepresentation
                    let formatted: RecordAvatarBulkMapRepresentation;
                    if (isRecordAvatarBulkMapRepresentation(response)) {
                        formatted = response.body;
                    } else {
                        formatted = (
                            response as ResourceResponse<RecordAvatarBulkRepresentation>
                        ).body.results.reduce((seed, avatar, index) => {
                            const recordId = recordIdsNotInFlight[index];
                            seed[recordId] = avatar;
                            return seed;
                        }, {} as RecordAvatarBulkMapRepresentation);
                    }

                    response.body = formatted;
                    return luvio.handleSuccessResponse(
                        () => onResourceResponseSuccess(luvio, config, resourceParams, response),
                        () => getResponseCacheKeys(resourceParams, formatted)
                    );
                },
                (err: FetchResponse<unknown>) => {
                    recordIdsNotInFlight.forEach((id) => IN_FLIGHT_REQUESTS.delete(id));
                    return onResourceResponseError(luvio, config, resourceParams, err);
                }
            );
    }

    // For any currently in flight record ids lets emit a fake response
    if (recordIdsInFlight.length > 0) {
        ingestFakeResponse(luvio, recordIdsInFlight);
    }

    return luvioResponse ? luvioResponse : Promise.resolve(buildInMemorySnapshot(luvio, config));
}
