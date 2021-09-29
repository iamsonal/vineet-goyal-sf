import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh as lwcLdsBindWireRefresh,
} from '@luvio/lwc-luvio';
import { createImperativeAdapter as ldsBindingsCreateImperativeAdapter } from '@salesforce/lds-bindings';

export function createWireAdapterConstructor(luvio, factory, metadata) {
    const { apiFamily, name } = metadata;
    const adapter = createLDSAdapter(luvio, name, factory);
    return lwcLdsCreateWireAdapterConstructor(adapter, `${apiFamily}.${name}`, luvio);
}

export function createLDSAdapter(luvio, name, factory) {
    return factory(luvio);
}

export let refresh;

export function bindWireRefresh(luvio) {
    refresh = lwcLdsBindWireRefresh(luvio);
}

// Doesn't create an instrumented adapter just a wrapper to call createLDSAdapter for testing
export function createInstrumentedAdapter(luvio, factory, metadata) {
    const { name } = metadata;
    return createLDSAdapter(luvio, name, factory);
}

export function createImperativeAdapter(luvio, adapter, metadata) {
    return ldsBindingsCreateImperativeAdapter(luvio, adapter, metadata);
}
