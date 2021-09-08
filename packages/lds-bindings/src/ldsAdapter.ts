import { Luvio } from '@luvio/engine';

export function createLDSAdapter<T>(luvio: Luvio, name: string, factory: (luvio: Luvio) => T): T {
    return factory(luvio);
}
