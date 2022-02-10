import type { DurableStore, DurableStoreEntries } from '@luvio/environments';
import { DefaultDurableSegment } from '@luvio/environments';
import type { DurableRecordEntry } from './records';
import { isStoreRecordError } from './records';
import type { ObjectInfoRepresentation } from '@salesforce/lds-adapters-uiapi';
import { keyBuilderObjectInfo } from '@salesforce/lds-adapters-uiapi';
import { ObjectKeys } from './language';

/**
 * Extract the relevant object infos from the durable store given a set of records
 * Returns a set of object infos keyed by their apiName
 * @param durableStore
 * @param records
 */
export function getObjectInfosForRecords(
    durableStore: DurableStore,
    records: DurableStoreEntries<DurableRecordEntry>
): Promise<Record<string, ObjectInfoRepresentation>> {
    const recordKeys = ObjectKeys(records);
    const apiNames: { [key: string]: true } = {};
    for (let i = 0; i < recordKeys.length; i++) {
        const entry = records[recordKeys[i]];
        const record = entry.data;
        if (isStoreRecordError(record)) {
            continue;
        }
        apiNames[record.apiName] = true;
    }

    return getObjectInfos(durableStore, ObjectKeys(apiNames));
}

export function getObjectInfos(
    durableStore: DurableStore,
    apiNames: string[]
): Promise<Record<string, ObjectInfoRepresentation>> {
    const result: Record<string, ObjectInfoRepresentation> = {};

    if (apiNames.length === 0) {
        return Promise.resolve(result);
    }

    const keys = apiNames.map((apiName) => {
        return keyBuilderObjectInfo({ apiName });
    });

    return durableStore
        .getEntries<ObjectInfoRepresentation>(keys, DefaultDurableSegment)
        .then((entries) => {
            if (entries === undefined) {
                return result;
            }
            for (let i = 0, len = keys.length; i < len; i++) {
                const key = keys[i];
                const entry = entries[key];
                if (entry !== undefined) {
                    const objectInfo = entry.data;
                    result[objectInfo.apiName] = objectInfo;
                }
            }

            return result;
        });
}
