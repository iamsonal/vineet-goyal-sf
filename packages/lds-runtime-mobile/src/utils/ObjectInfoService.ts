import { Adapter } from '@luvio/engine';
import { DurableStore, DurableStoreEntries } from '@luvio/environments';
import {
    ObjectInfoRepresentation,
    getObjectInfoAdapterFactory,
} from '@salesforce/lds-adapters-uiapi';

export const OBJECT_INFO_PREFIX_SEGMENT = 'OBJECT_INFO_PREFIX_SEGMENT';
export interface ObjectInfoIndex {
    apiName: string;
    keyPrefix: string;
}

function missingObjectInfoError(info: { apiName?: string; prefix?: string }) {
    const message = info.apiName || info.prefix || '';
    return new Error(`ObjectInfo for ${message} is not primed into the durable store`);
}

type ObjectInfoAdapterReturn = ReturnType<typeof getObjectInfoAdapterFactory>;
type ObjectInfoConfig = Parameters<ObjectInfoAdapterReturn>[0];

export function objectInfoServiceFactory(
    getObjectInfo: Adapter<ObjectInfoConfig, ObjectInfoRepresentation>,
    durableStore: DurableStore
) {
    function findInfo(info: { apiName?: string; prefix?: string }) {
        return durableStore
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
    }

    function objectInfoMapExists(apiName: string) {
        return durableStore
            .getEntries<ObjectInfoIndex>([apiName], OBJECT_INFO_PREFIX_SEGMENT)
            .then((entries) => entries !== undefined && entries[apiName] !== undefined);
    }

    function ensureObjectInfoCached(apiName: string) {
        return objectInfoMapExists(apiName).then((exists) => {
            if (!exists) {
                return Promise.resolve(
                    getObjectInfo({
                        objectApiName: apiName,
                    })
                ).then((snapshot) => {
                    if (snapshot !== null && snapshot.data !== undefined) {
                        const apiName = snapshot.data.apiName;
                        const keyPrefix = snapshot.data.keyPrefix ?? '';
                        const entries: DurableStoreEntries<ObjectInfoIndex> = {
                            [apiName]: {
                                data: {
                                    apiName,
                                    keyPrefix,
                                },
                            },
                        };
                        return durableStore.setEntries(entries, OBJECT_INFO_PREFIX_SEGMENT);
                    } else {
                        throw new Error(`No snapshot found for apiName ${apiName}`);
                    }
                });
            }
        });
    }

    return {
        apiNameForPrefix: (prefix: string) => {
            return findInfo({ prefix });
        },

        prefixForApiName: (apiName: string) => {
            return findInfo({ apiName });
        },
        ensureObjectInfoCached,
    };
}
