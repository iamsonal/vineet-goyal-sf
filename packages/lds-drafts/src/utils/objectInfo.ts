import { DefaultDurableSegment, DurableStore, DurableStoreEntries } from '@luvio/environments';
import { DurableRecordEntry, isStoreRecordError } from './records';
import { ObjectInfoRepresentation, keyBuilderObjectInfo } from '@salesforce/lds-adapters-uiapi';
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
    const objectInfoKeys: { [key: string]: true } = {};
    for (let i = 0; i < recordKeys.length; i++) {
        const entry = records[recordKeys[i]];
        const record = entry.data;
        if (isStoreRecordError(record)) {
            continue;
        }
        const { apiName } = record;
        if (apiName !== undefined) {
            const objectInfoKey = keyBuilderObjectInfo({ apiName });
            objectInfoKeys[objectInfoKey] = true;
        }
    }
    const objectInfoKeysArray = ObjectKeys(objectInfoKeys);

    return durableStore
        .getEntries<ObjectInfoRepresentation>(objectInfoKeysArray, DefaultDurableSegment)
        .then((entries) => {
            const result: Record<string, ObjectInfoRepresentation> = {};
            if (entries === undefined) {
                return result;
            }
            for (let i = 0, len = objectInfoKeysArray.length; i < len; i++) {
                const key = objectInfoKeysArray[i];
                const entry = entries[key];
                if (entry !== undefined) {
                    const objectInfo = entry.data;
                    result[objectInfo.apiName] = objectInfo;
                }
            }

            return result;
        });
}
