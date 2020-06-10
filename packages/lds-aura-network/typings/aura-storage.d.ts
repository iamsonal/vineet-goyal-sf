declare module 'aura-storage' {
    export interface AuraStorageConfig {
        name: string;
        persistent?: boolean;
        secure?: boolean;
        maxSize?: number;
        expiration?: number;
        clearOnInit?: boolean;
        debugLogging?: boolean;
    }

    export interface AuraStorage {
        name: string;
        persistent: boolean;
        secure: boolean;
        maxSize: number;
        expiration: number;
        debugLogging: boolean;
        clearOnInit: boolean;
        version: string;
        autoRefreshInterval: number;
        storage: Map<any, any>;

        getName(): string;
        getSize(): Promise<number>;
        getMaxSize(): number;
        clear(): Promise<void>;
        get(key: string): Promise<unknown>;
        inFlightOperations(): number;
        getAll(keys: string[]): unknown[];
        set(key: string, value: unknown): Promise<void>;
        setAll(values: object): Promise<void>;
        remove(key: string): Promise<unknown>;
        removeAll(keys: string[]): Promise<unknown>;
        suspendSweeping(): void;
        resumeSweeping(): void;
        isPersistent(): boolean;
        isSecure(): boolean;
        getVersion(): string;
        getExpiration(): number;
    }

    const storage: {
        getStorage(name: string): AuraStorage;
        getStorages(): AuraStorage[];
        initStorage(config: AuraStorageConfig): AuraStorage;
        deleteStorage(name: string): Promise<void>;
    };

    export default storage;
}
