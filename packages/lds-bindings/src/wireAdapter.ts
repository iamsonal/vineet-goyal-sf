import type { Adapter, Luvio } from '@luvio/engine';
import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    createInfiniteScrollingWireAdapterConstructor as lwcLdsCreateInfiniteScrollingWireAdapterConstructor,
} from '@luvio/lwc-luvio';
import type { WireAdapterConstructor } from '@lwc/engine-core';
import type { AdapterMetadata } from './ldsAdapter';

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

export function createInfiniteScrollingWireAdapterConstructor<C, D>(
    luvio: Luvio,
    adapter: Adapter<C, D>,
    metadata: AdapterMetadata
): WireAdapterConstructor {
    const { apiFamily, name } = metadata;

    return lwcLdsCreateInfiniteScrollingWireAdapterConstructor(
        adapter as Adapter<unknown, unknown>,
        `${apiFamily}.${name}`,
        luvio
    );
}
