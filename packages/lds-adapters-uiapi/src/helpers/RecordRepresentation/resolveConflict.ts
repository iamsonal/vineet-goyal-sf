import type { GetRecordConfig } from '../../generated/adapters/getRecord';
import { buildNetworkSnapshot as getRecordNetwork } from '../../wire/getRecord/GetRecordFields';
import { buildNetworkSnapshot as getRecordsNetwork } from '../../generated/adapters/getRecords';
import type {
    GetRecordsConfig,
    GetRecordsEntityConfiguration,
} from '../../raml-artifacts/adapters/getRecords/GetRecordsConfig';

import { ArrayPrototypePush, ArrayPrototypeReduce, ObjectKeys } from '../../util/language';
import type { RecordFieldTrie } from '../../util/records';
import { convertTrieToFields } from '../../util/records';
import { instrumentation } from '../../instrumentation';
import type { Luvio } from '@luvio/engine';

export interface RecordConflict {
    recordId: string;
    trackedFields: RecordFieldTrie;
}

export type RecordConflictMap = {
    // conflicts detected, indexed by record id
    conflicts: Record<string, RecordConflict>;

    // number of server requests that were made to resolve this tree of conflicts
    serverRequestCount: number;
};

// iterate through the map to build configs for network calls
export function resolveConflict(luvio: Luvio, map: RecordConflictMap): void {
    const ids = ObjectKeys(map.conflicts) as string[];
    if (ids.length === 0) {
        instrumentation.recordConflictsResolved(map.serverRequestCount);
        return;
    }

    if (ids.length === 1) {
        const recordId = ids[0];
        const config: GetRecordConfig = {
            recordId,
            optionalFields: convertTrieToFields(map.conflicts[recordId].trackedFields),
        };
        getRecordNetwork(luvio, config, map.serverRequestCount);
    } else {
        const records: GetRecordsEntityConfiguration[] = ArrayPrototypeReduce.call(
            ids,
            (acc, id: string) => {
                const { trackedFields } = map.conflicts[id];
                ArrayPrototypePush.call(acc, {
                    recordIds: [id],
                    optionalFields: convertTrieToFields(trackedFields),
                });
                return acc;
            },
            []
        ) as GetRecordsEntityConfiguration[];

        const config: GetRecordsConfig = { records };

        // eslint-disable-next-line @salesforce/lds/no-invalid-todo
        // TODO - need to propagate map.serverRequestCount here
        getRecordsNetwork(luvio, config);
    }
}
