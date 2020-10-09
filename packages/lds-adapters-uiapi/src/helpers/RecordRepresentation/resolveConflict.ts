import {
    buildNetworkSnapshot as getRecordNetwork,
    GetRecordConfig,
} from '../../generated/adapters/getRecord';
import { buildNetworkSnapshot as getRecordsNetwork } from '../../generated/adapters/getRecords';
import {
    GetRecordsConfig,
    GetRecordsEntityConfiguration,
} from '../../raml-artifacts/adapters/getRecords/GetRecordsConfig';

import { ArrayPrototypePush, ArrayPrototypeReduce, ObjectKeys } from '../../util/language';
import { RecordFieldTrie, convertTrieToFields } from '../../util/records';
import { LDS } from '@ldsjs/engine';

export interface RecordConflict {
    recordId: string;
    trackedFields: RecordFieldTrie;
}
export type RecordConflictMap = Record<string, RecordConflict>;

// iterate through the map to build configs for network calls
export function resolveConflict(lds: LDS, map: RecordConflictMap): void {
    const ids = ObjectKeys(map) as string[];
    if (ids.length === 0) return;

    if (ids.length === 1) {
        const recordId = ids[0];
        const config: GetRecordConfig = {
            recordId,
            optionalFields: convertTrieToFields(map[recordId].trackedFields),
        };
        getRecordNetwork(lds, config);
    } else {
        const records: GetRecordsEntityConfiguration[] = ArrayPrototypeReduce.call(
            ids,
            (acc: GetRecordsEntityConfiguration[], id: string) => {
                const { trackedFields } = map[id];
                ArrayPrototypePush.call(acc, {
                    recordIds: [id],
                    optionalFields: convertTrieToFields(trackedFields),
                });
                return acc;
            },
            []
        );

        const config: GetRecordsConfig = { records };

        getRecordsNetwork(lds, config);
    }
}
