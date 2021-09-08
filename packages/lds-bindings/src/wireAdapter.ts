import { Adapter, AdapterFactory, Luvio } from '@luvio/engine';
import { createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor } from '@luvio/lwc-luvio';
import { WireAdapterConstructor } from '@lwc/engine-core';
import { AdapterMetadata } from './instrumentation';
import { createInstrumentedAdapter } from './instrumentedAdapter';

export function createWireAdapterConstructor<C, D>(
    luvio: Luvio,
    factory: AdapterFactory<C, D>,
    metadata: AdapterMetadata
): WireAdapterConstructor {
    const { apiFamily, name } = metadata;

    return lwcLdsCreateWireAdapterConstructor(
        createInstrumentedAdapter(luvio, factory, metadata) as Adapter<unknown, unknown>,
        `${apiFamily}.${name}`,
        luvio
    );
}
