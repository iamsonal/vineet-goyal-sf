import { Adapter, AdapterFactory, Luvio } from '@luvio/engine';
import { instrumentation } from './instrumentation';
import { AdapterMetadata, createLDSAdapter } from './ldsAdapter';

export function createInstrumentedAdapter<C, D>(
    luvio: Luvio,
    factory: AdapterFactory<C, D>,
    metadata: AdapterMetadata
): Adapter<C, D> {
    return instrumentation.instrumentAdapter(
        createLDSAdapter(luvio, metadata.name, factory),
        metadata
    );
}
