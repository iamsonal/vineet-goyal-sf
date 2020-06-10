import { Adapter, AdapterFactory, LDS } from '@ldsjs/engine';
import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    WireAdapterConstructor,
} from '@ldsjs/lwc-lds';
import { lds } from '@salesforce/lds-web-runtime';
import { instrumentAdapter } from '@salesforce/lds-instrumentation';

export function createWireAdapterConstructor<C, D>(
    name: string,
    factory: AdapterFactory<C, D>
): WireAdapterConstructor {
    const adapter = instrumentAdapter(name, createLDSAdapter(name, factory));
    return lwcLdsCreateWireAdapterConstructor(adapter as Adapter<unknown, unknown>, name, lds);
}

export function createLDSAdapter<T>(name: string, factory: (lds: LDS) => T): T {
    return factory(lds);
}
