import { Adapter } from '@luvio/engine';
import { DurableStore, DurableStoreEntries } from '@luvio/environments';
import {
    ObjectInfoRepresentation,
    getObjectInfoAdapterFactory,
} from '@salesforce/lds-adapters-uiapi';
import { ObjectCreate } from '../utils/language';

export const OBJECT_INFO_PREFIX_SEGMENT = 'OBJECT_INFO_PREFIX_SEGMENT';
export interface ObjectInfoIndex {
    apiName: string;
    // keyPrefix will be null for `WorkOrderLineItemHistory` or `ServiceAppointmentHistory`
    keyPrefix: string | null;
}

function missingObjectInfoError(info: { apiName?: string; prefix?: string }) {
    const message = info.apiName || info.prefix || '';
    return new Error(`ObjectInfo for ${message} is not primed into the durable store`);
}

type ObjectInfoAdapterReturn = ReturnType<typeof getObjectInfoAdapterFactory>;
type ObjectInfoConfig = Parameters<ObjectInfoAdapterReturn>[0];

export class ObjectInfoService {
    private getObjectInfoAdapter: Adapter<ObjectInfoConfig, ObjectInfoRepresentation>;
    private durableStore: DurableStore;
    objectInfoMemoryCache: { [apiName: string]: string | null };

    constructor(
        getObjectInfoAdapter: Adapter<ObjectInfoConfig, ObjectInfoRepresentation>,
        durableStore: DurableStore
    ) {
        this.getObjectInfoAdapter = getObjectInfoAdapter;
        this.durableStore = durableStore;

        // Local in-memory cache for ObjectInfo entries seen in DurableStore eg: {'Account': 001}
        this.objectInfoMemoryCache = ObjectCreate(null);
    }

    apiNameForPrefix = (prefix: string): Promise<string> => {
        return this.findInfo({ prefix }) as Promise<string>;
    };

    prefixForApiName = (apiName: string): Promise<string | null> => {
        return this.findInfo({ apiName });
    };

    findInfo = (info: { apiName?: string; prefix?: string }): Promise<string | null> => {
        return this.durableStore
            .getAllEntries<ObjectInfoIndex>(OBJECT_INFO_PREFIX_SEGMENT)
            .then((entries) => {
                if (entries === undefined) {
                    throw missingObjectInfoError(info);
                }
                const keys = Object.keys(entries);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const entry = entries[keys[i]];

                    if (info.prefix !== undefined && info.prefix === entry.data.keyPrefix) {
                        return entry.data.apiName;
                    }

                    if (info.apiName !== undefined && info.apiName === entry.data.apiName) {
                        return entry.data.keyPrefix;
                    }
                }
                throw missingObjectInfoError(info);
            });
    };

    /**
     * Caches ObjectInfo(ApiName and KeyPrefix) in Durable Store
     *
     * @param apiName eg: 'Account'
     * @param objectInfo Object Info
     *
     * @returns Promise
     */
    createObjectInfoMapping = (
        apiName: string,
        objectInfo: ObjectInfoRepresentation
    ): Promise<void> => {
        const { keyPrefix } = objectInfo;

        const entries: DurableStoreEntries<ObjectInfoIndex> = {
            [apiName]: {
                data: {
                    apiName,
                    keyPrefix,
                },
            },
        };
        this.objectInfoMemoryCache[apiName] = keyPrefix;

        return this.durableStore.setEntries(entries, OBJECT_INFO_PREFIX_SEGMENT);
    };

    isObjectInfoInDurableStore = (apiName: string): Promise<boolean> => {
        if (this.objectInfoMemoryCache[apiName] !== undefined) {
            return Promise.resolve(true);
        }

        return this.durableStore
            .getEntries<ObjectInfoIndex>([apiName], OBJECT_INFO_PREFIX_SEGMENT)
            .then((entries) => {
                if (entries === undefined || entries[apiName] === undefined) {
                    return false;
                }

                this.objectInfoMemoryCache[apiName] = entries[apiName].data.keyPrefix;
                return true;
            });
    };

    ensureObjectInfoCached = (apiName: string, entry?: ObjectInfoRepresentation): Promise<void> => {
        return this.isObjectInfoInDurableStore(apiName).then((exists) => {
            if (!exists) {
                if (entry !== undefined) {
                    // Since ObjectInfo is provided, no need to fetch the snapshot
                    return this.createObjectInfoMapping(apiName, entry);
                }

                // ObjectInfo is not present in Durable store. Fetch
                return Promise.resolve(
                    this.getObjectInfoAdapter({
                        objectApiName: apiName,
                    })
                ).then((snapshot) => {
                    if (snapshot === null) {
                        if (process.env.NODE_ENV !== 'production') {
                            const err = new Error(`No snapshot found for apiName ${apiName}`);

                            return Promise.reject(err);
                        }
                    } else if (snapshot.data !== null && snapshot.data !== undefined) {
                        return this.createObjectInfoMapping(apiName, snapshot.data);
                    }
                });
            }
        });
    };
}
