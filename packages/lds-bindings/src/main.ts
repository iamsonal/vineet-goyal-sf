import { Adapter, AdapterFactory, Luvio } from '@luvio/engine';
import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh,
} from '@luvio/lwc-luvio';
import { WireAdapterConstructor } from '@lwc/engine-core';
import { luvio } from '@salesforce/lds-runtime-web';
import { instrumentation, refreshApiEvent, refreshApiNames } from '@salesforce/lds-instrumentation';

export function createWireAdapterConstructor<C, D>(
    name: string,
    factory: AdapterFactory<C, D>
): WireAdapterConstructor {
    const adapter = instrumentation.instrumentAdapter(name, createLDSAdapter(name, factory));
    return lwcLdsCreateWireAdapterConstructor(adapter as Adapter<unknown, unknown>, name, luvio);
}

export function createLDSAdapter<T>(name: string, factory: (luvio: Luvio) => T): T {
    return factory(luvio);
}

const wireRefresh = bindWireRefresh(luvio);
export function refresh(data: any, apiFamily: keyof refreshApiNames) {
    luvio.instrument(refreshApiEvent(apiFamily));
    return wireRefresh(data);
}
