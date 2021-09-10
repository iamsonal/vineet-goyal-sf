import { Luvio } from '@luvio/engine';

export interface AdapterMetadata {
    apiFamily: string;
    name: string;
    ttl?: number;
}

export function createLDSAdapter<T>(luvio: Luvio, name: string, factory: (luvio: Luvio) => T): T {
    return factory(luvio);
}
