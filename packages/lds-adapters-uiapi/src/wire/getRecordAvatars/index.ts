import {
    AdapterFactory,
    LDS,
    PathSelection,
    Snapshot,
    UnfulfilledSnapshot,
    FetchResponse,
    SnapshotRefresh,
} from '@ldsjs/engine';
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

export function buildInMemorySnapshot(lds: LDS, config: GetRecordAvatarsConfig) {
    const { recordIds } = config;
    const sel = selectAvatars(recordIds);
    return lds.storeLookup<RecordAvatarBulkRepresentation>(
        {
            recordId: KEY,
            node: {
                kind: 'Fragment',
                selections: sel,
            },
            variables: {},
        },
        buildSnapshotRefresh(lds, config, recordIds)
    );
}

function buildSnapshotRefresh(
    lds: LDS,
    config: GetRecordAvatarsConfig,
    recordIds: string[]
): SnapshotRefresh<RecordAvatarBulkRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config, recordIds),
    };
}

/**
 *
 * The third argument, "recordIds", is here because
 * We only want to fetch avatars that are actually missing
 * This list will be a subset of the recordIds that are on the adapter config.
 *
 */
export function buildNetworkSnapshot(
    lds: LDS,
    config: GetRecordAvatarsConfig,
    recordIds: string[]
): Promise<Snapshot<RecordAvatarBulkRepresentation>> {
    const resourceRequest = getUiApiRecordAvatarsBatchByRecordIds({
        urlParams: {
            recordIds,
        },
        queryParams: {},
    });

    return lds.dispatchResourceRequest<RecordAvatarBulkRepresentation>(resourceRequest).then(
        response => {
            const formatted: RecordAvatarBulkMapRepresentation = response.body.results.reduce(
                (seed, avatar, index) => {
                    const recordId = recordIds[index];
                    seed[recordId] = avatar;
                    return seed;
                },
                {} as RecordAvatarBulkMapRepresentation
            );

            lds.storeIngest<RecordAvatarBulkMapRepresentation>(KEY, resourceRequest, formatted);
            lds.storeBroadcast();
            return buildInMemorySnapshot(lds, config);
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(KEY, err);
            lds.storeBroadcast();
            return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config, recordIds));
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

export const factory: AdapterFactory<GetRecordAvatarsConfig, RecordAvatarBulkRepresentation> = (
    lds: LDS
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

        return buildNetworkSnapshot(lds, config, recordIds);
    };
