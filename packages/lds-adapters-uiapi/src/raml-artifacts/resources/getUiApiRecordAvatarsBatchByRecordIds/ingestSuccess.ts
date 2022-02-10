import type {
    FulfilledSnapshot,
    Luvio,
    PendingSnapshot,
    ResourceResponse,
    SnapshotRefresh,
    StaleSnapshot,
} from '@luvio/engine';
import type { RecordAvatarBulkMapRepresentation } from '../../../generated/types/RecordAvatarBulkMapRepresentation';
import { ingest } from '../../types/RecordAvatarBulkMapRepresentation/ingest';
import type { GetRecordAvatarsConfig } from '../../adapters/getRecordAvatars/utils';
import { recordAvatarsSelector, KEY } from '../../adapters/getRecordAvatars/utils';

interface ResourceRequestConfig {
    urlParams: {
        recordIds: Array<string>;
    };
    queryParams: {
        formFactor?: string;
    };
}

export function ingestSuccess(
    luvio: Luvio,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<RecordAvatarBulkMapRepresentation>,
    snapshotRefresh?: SnapshotRefresh<RecordAvatarBulkMapRepresentation>
):
    | FulfilledSnapshot<RecordAvatarBulkMapRepresentation, {}>
    | StaleSnapshot<RecordAvatarBulkMapRepresentation, {}>
    | PendingSnapshot<RecordAvatarBulkMapRepresentation, any> {
    const { body } = response;
    luvio.storeIngest<RecordAvatarBulkMapRepresentation>(KEY, ingest, body);

    let recordIds: string[] = [];
    if (snapshotRefresh) {
        recordIds = (snapshotRefresh.config as GetRecordAvatarsConfig).recordIds;
    }

    const snapshot = luvio.storeLookup<RecordAvatarBulkMapRepresentation>(
        recordAvatarsSelector(recordIds),
        snapshotRefresh
    );

    if (snapshot.state === 'Pending') {
        luvio.resolvePendingSnapshot(snapshot).then(() => {
            ingestSuccess(luvio, resourceParams, response, snapshotRefresh);
        });
        return snapshot;
    }

    if (process.env.NODE_ENV !== 'production') {
        if (snapshot.state !== 'Fulfilled') {
            throw new Error(
                'Invalid network response. Expected resource response to result in Fulfilled snapshot'
            );
        }
    }

    return snapshot as
        | FulfilledSnapshot<RecordAvatarBulkMapRepresentation, {}>
        | StaleSnapshot<RecordAvatarBulkMapRepresentation, {}>;
}
