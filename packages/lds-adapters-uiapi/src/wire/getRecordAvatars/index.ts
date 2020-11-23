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
import { ObjectKeys } from '../../util/language';
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

export function buildInMemorySnapshot(lds: Luvio, config: GetRecordAvatarsConfig) {
    const { recordIds } = config;
    const sel = selectAvatars(recordIds);
    return lds.storeLookup<RecordAvatarBulkMapRepresentation>(
        {
            recordId: KEY,
            node: {
                kind: 'Fragment',
                private: [],
                selections: sel,
            },
            variables: {},
        },
        buildSnapshotRefresh(lds, config, recordIds)
    );
}

function buildSnapshotRefresh(
    lds: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[]
): SnapshotRefresh<RecordAvatarBulkMapRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config, recordIds),
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

function isRecordAvatarBulkMapRepresentation(
    response: ResourceResponse<RecordAvatarBulkRepresentation | RecordAvatarBulkMapRepresentation>
): response is ResourceResponse<RecordAvatarBulkMapRepresentation> {
    return (response.body as any).hasErrors === undefined;
}

function onResponseSuccess(
    lds: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[],
    response: ResourceResponse<RecordAvatarBulkRepresentation | RecordAvatarBulkMapRepresentation>
) {
    let formatted: RecordAvatarBulkMapRepresentation;

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

    lds.storeIngest<RecordAvatarBulkMapRepresentation>(
        KEY,
        recordAvatarBulkMapRepresentationIngest,
        formatted
    );
    lds.storeBroadcast();
    return buildInMemorySnapshot(lds, config);
}

function onResponseError(
    lds: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[],
    err: FetchResponse<unknown>
) {
    lds.storeIngestFetchResponse(KEY, err);
    lds.storeBroadcast();
    return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config, recordIds));
}

function resolveUnfulfilledSnapshot(
    lds: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[],
    snapshot: UnfulfilledSnapshot<RecordAvatarBulkMapRepresentation, any>
) {
    const resourceRequest = buildRequest(recordIds);
    return lds.resolveUnfulfilledSnapshot(resourceRequest, snapshot).then(
        response => {
            return onResponseSuccess(lds, config, recordIds, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResponseError(lds, config, recordIds, err);
        }
    );
}

/**
 *
 * The third argument, "recordIds", is here because
 * We only want to fetch avatars that are actually missing
 * This list will be a subset of the recordIds that are on the adapter config.
 *
 */
export function buildNetworkSnapshot(
    lds: Luvio,
    config: GetRecordAvatarsConfig,
    recordIds: string[]
): Promise<Snapshot<RecordAvatarBulkMapRepresentation>> {
    const resourceRequest = buildRequest(recordIds);

    return lds.dispatchResourceRequest<RecordAvatarBulkRepresentation>(resourceRequest).then(
        response => {
            return onResponseSuccess(lds, config, recordIds, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResponseError(lds, config, recordIds, err);
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
    lds: Luvio
) =>
    function getRecordAvatars(unknown: unknown) {
        const config = validateAdapterConfig(unknown, getRecordAvatars_ConfigPropertyNames);
        if (config === null) {
            return null;
        }
        const cacheLookup = buildInMemorySnapshot(lds, config);

        // CACHE HIT
        if (lds.snapshotDataAvailable(cacheLookup)) {
            return cacheLookup;
        }

        // CACHE MISS
        // Only fetch avatars that are missing
        const recordIds = getRecordIds(config, cacheLookup);

        if (isUnfulfilledSnapshot(cacheLookup)) {
            return resolveUnfulfilledSnapshot(lds, config, recordIds, cacheLookup);
        }

        return buildNetworkSnapshot(lds, config, recordIds);
    };
