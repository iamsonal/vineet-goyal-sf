import { Adapter, AdapterFactory, Luvio } from '@luvio/engine';
import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh as luvioBindWireRefresh,
} from '@luvio/lwc-luvio';
import { WireAdapterConstructor } from '@lwc/engine-core';
import {
    instrumentation,
    refreshApiEvent,
    refreshApiNames,
    AdapterMetadata,
} from '@salesforce/lds-instrumentation';

export function createWireAdapterConstructor<C, D>(
    luvio: Luvio,
    factory: AdapterFactory<C, D>,
    metadata: AdapterMetadata
): WireAdapterConstructor {
    const { apiFamily, name } = metadata;
    const adapter = instrumentation.instrumentAdapter(
        createLDSAdapter(luvio, name, factory),
        metadata
    );
    return lwcLdsCreateWireAdapterConstructor(
        adapter as Adapter<unknown, unknown>,
        `${apiFamily}.${name}`,
        luvio
    );
}

export function createLDSAdapter<T>(luvio: Luvio, name: string, factory: (luvio: Luvio) => T): T {
    return factory(luvio);
}

export let refresh: (data: any, apiFamily: keyof refreshApiNames) => Promise<undefined> | undefined;

export function bindWireRefresh(luvio: Luvio) {
    const wireRefresh = luvioBindWireRefresh(luvio);
    refresh = (data: any, apiFamily: keyof refreshApiNames) => {
        luvio.instrument(refreshApiEvent(apiFamily));
        return wireRefresh(data);
    };
}
