import { Adapter, Luvio } from '@luvio/engine';
import { createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor } from '@luvio/lwc-luvio';
import { WireAdapterConstructor } from '@lwc/engine-core';
import { AdapterMetadata } from './ldsAdapter';

export function createWireAdapterConstructor<C, D>(
    luvio: Luvio,
    adapter: Adapter<C, D>,
    metadata: AdapterMetadata
): WireAdapterConstructor {
    const { apiFamily, name } = metadata;

    return lwcLdsCreateWireAdapterConstructor(
        adapter as Adapter<unknown, unknown>,
        `${apiFamily}.${name}`,
        luvio
    );
}
