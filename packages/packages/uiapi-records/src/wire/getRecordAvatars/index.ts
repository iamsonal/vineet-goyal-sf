import {
    AdapterFactory,
    LDS,
    PathSelection,
    Snapshot,
    UnfulfilledSnapshot,
    FetchResponse,
} from '@salesforce-lds/engine';
import { ObjectKeys } from '../../util/language';
import { isFulfilledSnapshot, isUnfulfilledSnapshot } from '../../util/snapshot';
import { RecordAvatarBulkRepresentation } from '../../generated/types/RecordAvatarBulkRepresentation';
import getUiApiRecordAvatarsBatchByRecordIds from '../../generated/resources/getUiApiRecordAvatarsBatchByRecordIds';
import {
    validateAdapterConfig,
    getRecordAvatars_ConfigPropertyNames,
    GetRecordAvatarsConfig,
} from '../../generated/adapters/getRecordAvatars';
import { refreshable, keyPrefix } from '../../generated/adapters/adapter-utils';
import {
    select as photoRecordAvatarRepresentationSelect,
    PhotoRecordAvatarRepresentation,
} from '../../generated/types/PhotoRecordAvatarRepresentation';
import {
    select as themeRecordAvatarRepresentationSelect,
    ThemeRecordAvatarRepresentation,
} from '../../generated/types/ThemeRecordAvatarRepresentation';
import { ErrorSingleRecordAvatarRepresentation } from '../../generated/types/ErrorSingleRecordAvatarRepresentation';

interface RecordAvatarBulkServerRepresentation {
    hasErrors: boolean;
    results: Array<{
        result:
            | PhotoRecordAvatarRepresentation
            | ThemeRecordAvatarRepresentation
            | ErrorSingleRecordAvatarRepresentation;
        statusCode: number;
    }>;
}

const recordAvatarSelections: PathSelection[] = [
    {
        kind: 'Link',
        name: 'result',
        union: true,
        discriminator: 'type',
        unionSelections: {
            Photo: photoRecordAvatarRepresentationSelect().selections,
            Theme: themeRecordAvatarRepresentationSelect().selections,

            // Hand rolled, we don't want to emit the properties from AbstractAvatarRepresentation
            MissingSingle: [
                {
                    name: 'errorCode',
                    kind: 'Scalar',
                },
                {
                    name: 'message',
                    kind: 'Scalar',
                },
            ],
        },
    },
    {
        kind: 'Scalar',
        name: 'statusCode',
    },
];

function selectAvatars(recordIds: string[]): PathSelection[] {
    return recordIds.map((recordId: string) => {
        return {
            kind: 'Link',
            name: recordId,
            selections: recordAvatarSelections,
        };
    });
}

// All of the avatars are ingested into
// the same top level object
const KEY = `${keyPrefix}RecordAvatarsBulk`;

function cache(lds: LDS, config: GetRecordAvatarsConfig) {
    const sel = selectAvatars(config.recordIds);
    return lds.storeLookup<RecordAvatarBulkRepresentation>({
        recordId: KEY,
        node: {
            kind: 'Fragment',
            selections: sel,
        },
        variables: {},
    });
}

/**
 *
 * The third argument, "recordIds", is here because
 * We only want to fetch avatars that are actually missing
 * This list will be a subset of the recordIds that are on the adapter config.
 *
 */
function network(lds: LDS, config: GetRecordAvatarsConfig, recordIds: string[]) {
    const resourceRequest = getUiApiRecordAvatarsBatchByRecordIds({
        urlParams: {
            recordIds,
        },
        queryParams: {},
    });

    return lds.dispatchResourceRequest<RecordAvatarBulkServerRepresentation>(resourceRequest).then(
        response => {
            const formatted: RecordAvatarBulkRepresentation = response.body.results.reduce(
                (seed, avatar, index) => {
                    const recordId = recordIds[index];
                    // error responses
                    // Fill in the missing discriminators
                    if (avatar.statusCode !== 200) {
                        avatar.result.recordId = recordId;
                        avatar.result.type = 'MissingSingle';
                    }

                    seed[recordId] = avatar;
                    return seed;
                },
                {} as RecordAvatarBulkRepresentation
            );

            lds.storeIngest<RecordAvatarBulkRepresentation>(KEY, resourceRequest, formatted);
            lds.storeBroadcast();
            return cache(lds, config);
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(KEY, err);
            lds.storeBroadcast();
            return lds.errorSnapshot(err);
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
) => {
    return refreshable(
        function(unknown: unknown) {
            const config = validateAdapterConfig(unknown, getRecordAvatars_ConfigPropertyNames);
            if (config === null) {
                return null;
            }
            const cacheLookup = cache(lds, config);

            // CACHE HIT
            if (isFulfilledSnapshot(cacheLookup)) {
                return cacheLookup;
            }

            // CACHE MISS
            // Only fetch avatars that are missing
            const recordIds = getRecordIds(config, cacheLookup);

            return network(lds, config, recordIds);
        },
        (untrusted: unknown) => {
            const config = validateAdapterConfig(untrusted, getRecordAvatars_ConfigPropertyNames);
            if (config === null) {
                throw new Error('Refresh should not be called with partial configuration');
            }

            return network(lds, config, config.recordIds);
        }
    );
};
