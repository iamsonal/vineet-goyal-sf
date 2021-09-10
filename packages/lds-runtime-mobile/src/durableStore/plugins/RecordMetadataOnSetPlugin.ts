import { DefaultDurableSegment, DurableStoreEntry } from '@luvio/environments';
import { isEntryDurableRecordRepresentation } from '@salesforce/lds-drafts';
import { DurableStoreSetEntryPlugin } from './DurableStorePlugins';
import { ObjectInfoRepresentation } from '@salesforce/lds-adapters-uiapi';

type EnsureCachedObjectInfoFunction = (
    apiName: string,
    entry?: ObjectInfoRepresentation
) => Promise<void>;

const KEY_PREFIX_OBJECT_INFO = 'UiApi::ObjectInfoRepresentation:';
export class RecordMetadataOnSetPlugin implements DurableStoreSetEntryPlugin {
    private ensureObjectInfoCached: EnsureCachedObjectInfoFunction;

    constructor(ensureObjectInfoCached: EnsureCachedObjectInfoFunction) {
        this.ensureObjectInfoCached = ensureObjectInfoCached;
    }

    alreadyFetchedApiName: { [apiName: string]: true } = {};

    isEntryObjectInfoRepresentation(
        entry: DurableStoreEntry<any>,
        key: string
    ): entry is DurableStoreEntry<ObjectInfoRepresentation> {
        return key.startsWith(KEY_PREFIX_OBJECT_INFO);
    }

    beforeSet<T>(
        key: string,
        entry: DurableStoreEntry<Extract<T, unknown>>,
        segment: string
    ): Promise<void> {
        if (segment === DefaultDurableSegment) {
            if (isEntryDurableRecordRepresentation(entry, key)) {
                const apiName = entry.data.apiName;
                if (this.alreadyFetchedApiName[apiName] === true) {
                    return Promise.resolve();
                }
                // debounce multiple identical requests per durable write operations
                this.alreadyFetchedApiName[apiName] = true;
                return this.ensureObjectInfoCached(apiName)
                    .catch(() => {
                        //TODO: log this W-9067768
                    })
                    .finally(() => {
                        delete this.alreadyFetchedApiName[apiName];
                    });
            } else if (this.isEntryObjectInfoRepresentation(entry, key)) {
                return this.ensureObjectInfoCached(entry.data.apiName, entry.data);
            }
        }

        return Promise.resolve();
    }
}
