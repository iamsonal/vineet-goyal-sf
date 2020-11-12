import { Adapter, AdapterFactory, LDS } from '@ldsjs/engine';
import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh,
} from '@ldsjs/lwc-lds';
import { WireAdapterConstructor } from '@lwc/engine-core';
import { lds } from '@salesforce/lds-runtime-web';
import { instrumentation, refreshApiEvent, refreshApiNames } from '@salesforce/lds-instrumentation';

export function createWireAdapterConstructor<C, D>(
    name: string,
    factory: AdapterFactory<C, D>
): WireAdapterConstructor {
    const adapter = instrumentation.instrumentAdapter(name, createLDSAdapter(name, factory));
    return lwcLdsCreateWireAdapterConstructor(adapter as Adapter<unknown, unknown>, name, lds);
}

export function createLDSAdapter<T>(name: string, factory: (lds: LDS) => T): T {
    return factory(lds);
}

const wireRefresh = bindWireRefresh(lds);
export function refresh(data: any, apiFamily: keyof refreshApiNames) {
    lds.instrument(refreshApiEvent(apiFamily));
    return wireRefresh(data);
}
