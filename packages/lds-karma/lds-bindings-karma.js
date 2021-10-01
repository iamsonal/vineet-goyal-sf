import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh as lwcLdsBindWireRefresh,
} from '@luvio/lwc-luvio';
import { createImperativeAdapter as ldsBindingsCreateImperativeAdapter } from '@salesforce/lds-bindings';

export function createWireAdapterConstructor(luvio, adapter, metadata) {
    const { apiFamily, name } = metadata;
    return lwcLdsCreateWireAdapterConstructor(adapter, `${apiFamily}.${name}`, luvio);
}

export function createLDSAdapter(luvio, name, factory) {
    return factory(luvio);
}

export let refresh;

export function bindWireRefresh(luvio) {
    refresh = lwcLdsBindWireRefresh(luvio);
}

// Doesn't create an instrumented adapter
// We don't test our instrumentation in karma tests for adapters
// This just returns the ldsAdapter it receives
export function createInstrumentedAdapter(adapter, _metadata) {
    return adapter;
}

export function createImperativeAdapter(luvio, adapter, metadata) {
    return ldsBindingsCreateImperativeAdapter(luvio, adapter, metadata);
}
