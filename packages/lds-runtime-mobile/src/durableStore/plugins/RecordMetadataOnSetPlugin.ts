import { DefaultDurableSegment, DurableStoreEntry } from '@luvio/environments';
import { isEntryDurableRecordRepresentation } from '@salesforce/lds-drafts';
import { DurableStoreSetEntryPlugin } from './DurableStorePlugins';
import { ObjectInfoRepresentation } from '@salesforce/lds-adapters-uiapi';

type EnsureCachedObjectInfoFunction = (
    apiName: string,
    entry?: ObjectInfoRepresentation
) => Promise<void>;

// TODO [W-9883877]: Pull the key prefix from the uiapi module
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
            let apiName: string | null = null,
                objectInfo: ObjectInfoRepresentation | undefined = undefined;

            if (isEntryDurableRecordRepresentation(entry, key)) {
                apiName = entry.data.apiName;
            } else if (this.isEntryObjectInfoRepresentation(entry, key)) {
                apiName = entry.data.apiName;
                objectInfo = entry.data;
            }

            if (apiName !== null) {
                if (this.alreadyFetchedApiName[apiName] === true) {
                    return Promise.resolve();
                }
                // debounce multiple identical requests per durable write operations
                this.alreadyFetchedApiName[apiName] = true;

                return this.ensureObjectInfoCached(apiName, objectInfo)
                    .catch(() => {
                        //TODO: log this W-9067768
                    })
                    .finally(() => {
                        delete this.alreadyFetchedApiName[apiName as string];
                    });
            }
        }

        return Promise.resolve();
    }
}
