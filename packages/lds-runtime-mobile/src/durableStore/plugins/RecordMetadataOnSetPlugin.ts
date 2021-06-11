import { DefaultDurableSegment, DurableStoreEntry } from '@luvio/environments';
import {
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '@salesforce/lds-adapters-uiapi';
import { isStoreKeyRecordId } from '@salesforce/lds-uiapi-record-utils';
import { DurableStoreSetEntryPlugin } from './DurableStorePlugins';

type CachedObjectInfoFunction = (apiName: string) => Promise<void>;

export class RecordMetadataOnSetPlugin implements DurableStoreSetEntryPlugin {
    private ensureObjectInfoCached: CachedObjectInfoFunction;

    constructor(ensureObjectInfoCached: CachedObjectInfoFunction) {
        this.ensureObjectInfoCached = ensureObjectInfoCached;
    }

    alreadyFetchedApiName: { [apiName: string]: true } = {};

    beforeSet<T>(
        key: string,
        entry: DurableStoreEntry<Extract<T, unknown>>,
        segment: string
    ): void {
        if (segment === DefaultDurableSegment && isRecordRepresentation(entry, key)) {
            const apiName = entry.data.apiName;
            if (this.alreadyFetchedApiName[apiName] === true) {
                return;
            }
            // debounce multiple identical requests per durable write operations
            this.alreadyFetchedApiName[apiName] = true;
            this.ensureObjectInfoCached(apiName)
                .catch(() => {
                    //TODO: log this W-9067768
                })
                .finally(() => {
                    delete this.alreadyFetchedApiName[apiName];
                });
        }
    }
}

function isRecordRepresentation(
    entry: DurableStoreEntry<any>,
    key: string
): entry is DurableStoreEntry<RecordRepresentation | RecordRepresentationNormalized> {
    return isStoreKeyRecordId(key) && entry.data.apiName !== undefined;
}
