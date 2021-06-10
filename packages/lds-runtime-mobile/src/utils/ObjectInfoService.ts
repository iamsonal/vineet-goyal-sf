import { Adapter } from '@luvio/engine';
import { DurableStore } from '@luvio/environments';
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

    // TODO: W-9427909 - Re-enable this later in a way that doesn't cause duplicate object info requests
    // function objectInfoMapExists(apiName: string) {
    //     return durableStore
    //         .getEntries<ObjectInfoIndex>([apiName], OBJECT_INFO_PREFIX_SEGMENT)
    //         .then((entries) => entries !== undefined && entries[apiName] !== undefined);
    // }

    // TODO: W-9427909 - Re-enable this later in a way that doesn't cause duplicate object info requests
    function ensureObjectInfoCached(_apiName: string) {
        return Promise.resolve();
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
