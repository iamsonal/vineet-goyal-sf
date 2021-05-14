import auraStorage, { AuraStorage, AuraStorageConfig } from 'aura-storage';

// The VERSION environment variable is replaced by rollup during the bundling and replaces it with
// the commit hash. This avoid having a cache hit on data that has been stored by a previous
// version of LDS.
const STORAGE_VERSION = process.env.VERSION;

// AuraStorage treats `secure` as a must-have whereas `persistent` is a nice-to-have. Secure and
// persistent storage is only possible with CryptoAdapter. Availability of that adapter is
// controlled by the application.
const STORAGE_CONFIG = {
    persistent: true,
    secure: true,
    maxSize: 5 * 1024 * 1024, // 5 MB.
    clearOnInit: false,
    debugLogging: false,
    version: STORAGE_VERSION,
};

const STORAGE_INSTANCES: AuraStorage[] = [];

export function createStorage(config: AuraStorageConfig): AuraStorage | null {
    if (auraStorage.initStorage === undefined) {
        return null;
    }

    const storageConfig: AuraStorageConfig = {
        ...STORAGE_CONFIG,
        ...config,
    };

    const storage = auraStorage.initStorage(storageConfig);

    if (!storage.isPersistent()) {
        if (auraStorage.deleteStorage !== undefined) {
            auraStorage.deleteStorage(storageConfig.name).catch(() => {}); // intentional noop on error
        }

        return null;
    }

    STORAGE_INSTANCES.push(storage);

    return storage;
}

export function clearStorages(): Promise<void[]> {
    return Promise.all(
        STORAGE_INSTANCES.map((storage) => {
            return storage.clear().catch(() => {}); // intentional noop on error
        })
    );
}
