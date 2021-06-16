import { DefaultDurableSegment, DurableStoreEntry } from '@luvio/environments';
import { isEntryDurableRecordRepresentation } from '@salesforce/lds-drafts';
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
        if (segment === DefaultDurableSegment && isEntryDurableRecordRepresentation(entry, key)) {
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
