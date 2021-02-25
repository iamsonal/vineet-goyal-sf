import {
    AdapterFactory,
    Luvio,
    PathSelection,
    Snapshot,
    UnfulfilledSnapshot,
    FetchResponse,
    SnapshotRefresh,
    ResourceResponse,
} from '@luvio/engine';
import { ObjectKeys, ArrayPrototypeReduce } from '../../util/language';
import { isUnfulfilledSnapshot } from '../../util/snapshot';
import { RecordAvatarBulkRepresentation } from '../../generated/types/RecordAvatarBulkRepresentation';
import getUiApiRecordAvatarsBatchByRecordIds from '../../generated/resources/getUiApiRecordAvatarsBatchByRecordIds';
import {
    validateAdapterConfig,
    getRecordAvatars_ConfigPropertyNames,
    GetRecordAvatarsConfig,
} from '../../generated/adapters/getRecordAvatars';
import { keyPrefix } from '../../generated/adapters/adapter-utils';
import { RecordAvatarBulkMapRepresentation } from '../../generated/types/RecordAvatarBulkMapRepresentation';
import { RecordAvatarBatchRepresentation } from '../../generated/types/RecordAvatarBatchRepresentation';
import { ingest as recordAvatarBulkMapRepresentationIngest } from '../../raml-artifacts/types/RecordAvatarBulkMapRepresentation/ingest';
import { selectChildren as selectChildrenAbstractRecordAvatarBatchRepresentation } from '../../generated/types/AbstractRecordAvatarBatchRepresentation';

function selectAvatars(recordIds: string[]): PathSelection[] {
    return recordIds.map((recordId: string) => {
        return {
            kind: 'Link',
            name: recordId,
            fragment: selectChildrenAbstractRecordAvatarBatchRepresentation(),
        };
    });
}

// All of the avatars are ingested into
// the same top level object
const KEY = `${keyPrefix}RecordAvatarsBulk`;

// Track in-flight requests so we known when to send out our fake response
const IN_FLIGHT_REQUESTS = new Set();

export function buildInMemorySnapshot(luvio: Luvio, config: GetRecordAvatarsConfig) {
    const { recordIds } = config;
    const sel = selectAvatars(recordIds);
    return luvio.storeLookup<RecordAvatarBulkMapRepresentation>(
        {
            recordId: KEY,
            node: {
                kind: 'Fragment',
                private: [],
                selections: sel,
            },
            variables: {},
        },
        buildSnapshotRefresh(luvio, config, recordIds)
    );
}

function buildSnapshotRefresh(
    luvio: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[]
): SnapshotRefresh<RecordAvatarBulkMapRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, recordIds),
    };
}

function buildRequest(recordIds: string[]) {
    const resourceRequest = getUiApiRecordAvatarsBatchByRecordIds({
        urlParams: {
            recordIds,
        },
        queryParams: {},
    });
    return resourceRequest;
}

/**
 * For 230/232 this is a workaround to not having inflight deduping for record avatars
 * The way it works is we ingest a fake response while the real response is pending.
 * So for example a component wires record avatars for ABC, while that request is in flight
 * another component wires record avatars AB. The wire for ABC will send off a request for data
 * Then AB comes in and will resolve the fake response instead of sending off a request.
 * Then once the real response comes back it will be ingested and it will notify both AB and ABC.
 * We will resolve this in 234 using real inflight deduping W-8318817
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

function onResponseSuccess(
    luvio: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[],
    response: ResourceResponse<RecordAvatarBulkRepresentation | RecordAvatarBulkMapRepresentation>
) {
    let formatted: RecordAvatarBulkMapRepresentation;

    // Remove ids from in flight list
    recordIds.forEach(id => IN_FLIGHT_REQUESTS.delete(id));

    // the selector passed to resolveUnfulfilledSnapshot requests the data already formatted so the response
    // can either be a RecordAvatarBulkRepresentation or a RecordAvatarBulkMapRepresentation
    if (isRecordAvatarBulkMapRepresentation(response)) {
        formatted = response.body;
    } else {
        formatted = (response as ResourceResponse<
            RecordAvatarBulkRepresentation
        >).body.results.reduce((seed, avatar, index) => {
            const recordId = recordIds[index];
            seed[recordId] = avatar;
            return seed;
        }, {} as RecordAvatarBulkMapRepresentation);
    }

    luvio.storeIngest<RecordAvatarBulkMapRepresentation>(
        KEY,
        recordAvatarBulkMapRepresentationIngest,
        formatted
    );
    luvio.storeBroadcast();
    return buildInMemorySnapshot(luvio, config);
}

function onResponseError(
    luvio: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[],
    err: FetchResponse<unknown>
) {
    // Remove ids from in flight list
    recordIds.forEach(id => IN_FLIGHT_REQUESTS.delete(id));

    luvio.storeIngestFetchResponse(KEY, err);
    luvio.storeBroadcast();
    return luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, config, recordIds));
}

function resolveUnfulfilledSnapshot(
    luvio: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[],
    snapshot: UnfulfilledSnapshot<RecordAvatarBulkMapRepresentation, any>
) {
    const recordIdsNotInFlight: string[] = [],
        recordIdsInFlight: string[] = [];
    let luvioResponse;

    // Split up the given record ids into in flight ids and not in flight ids
    recordIds.forEach(id => {
        if (IN_FLIGHT_REQUESTS.has(id)) {
            recordIdsInFlight.push(id);
        } else {
            recordIdsNotInFlight.push(id);
        }
    });

    // For any remaining record ids send off the real request and add it to the in flight request list
    if (recordIdsNotInFlight.length > 0) {
        recordIdsNotInFlight.forEach(id => IN_FLIGHT_REQUESTS.add(id));
        const resourceRequest = buildRequest(recordIdsNotInFlight);

        luvioResponse = luvio.resolveUnfulfilledSnapshot(resourceRequest, snapshot).then(
            response => {
                return onResponseSuccess(luvio, config, recordIdsNotInFlight, response);
            },
            (err: FetchResponse<unknown>) => {
                return onResponseError(luvio, config, recordIdsNotInFlight, err);
            }
        );
    }

    // For any currently in flight record ids lets emit a fake response
    if (recordIdsInFlight.length > 0) {
        ingestFakeResponse(luvio, recordIdsInFlight);
    }

    return luvioResponse ? luvioResponse : buildInMemorySnapshot(luvio, config);
}

/**
 *
 * The third argument, "recordIds", is here because
 * We only want to fetch avatars that are actually missing
 * This list will be a subset of the recordIds that are on the adapter config.
 *
 */
export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[]
): Promise<Snapshot<RecordAvatarBulkMapRepresentation>> {
    const resourceRequest = buildRequest(recordIds);

    return luvio.dispatchResourceRequest<RecordAvatarBulkRepresentation>(resourceRequest).then(
        response => {
            return onResponseSuccess(luvio, config, recordIds, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResponseError(luvio, config, recordIds, err);
        }
    );
}

// We have to type guard against pending snapshots
// We should only ever get UnfulfilledSnapshot here
function getRecordIds(config: GetRecordAvatarsConfig, snapshot: Snapshot<unknown, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
        if (isUnfulfilledSnapshot(snapshot) === false) {
            throw new Error('Unexpected snapshot state in "getRecordIds" in "getRecordAvatars"');
        }
    }

    // Missing all avatars
    if (snapshot.data === undefined) {
        return config.recordIds;
    }

    return ObjectKeys((snapshot as UnfulfilledSnapshot<unknown, unknown>).missingPaths).sort();
}

export const factory: AdapterFactory<GetRecordAvatarsConfig, RecordAvatarBulkMapRepresentation> = (
    luvio: Luvio
) =>
    function getRecordAvatars(unknown: unknown) {
        const config = validateAdapterConfig(unknown, getRecordAvatars_ConfigPropertyNames);
        if (config === null) {
            return null;
        }
        const cacheLookup = buildInMemorySnapshot(luvio, config);

        // CACHE HIT
        if (luvio.snapshotDataAvailable(cacheLookup)) {
            return cacheLookup;
        }

        // CACHE MISS
        // Only fetch avatars that are missing
        const recordIds = getRecordIds(config, cacheLookup);

        if (isUnfulfilledSnapshot(cacheLookup)) {
            return resolveUnfulfilledSnapshot(luvio, config, recordIds, cacheLookup);
        }

        return buildNetworkSnapshot(luvio, config, recordIds);
    };
