import type { Adapter } from '@luvio/engine';
import { instrumentation } from './instrumentation';
import type { AdapterMetadata } from './ldsAdapter';

export function createInstrumentedAdapter<C, D>(
    adapter: Adapter<C, D>,
    metadata: AdapterMetadata
): Adapter<C, D> {
    return instrumentation.instrumentAdapter(adapter, metadata);
}
