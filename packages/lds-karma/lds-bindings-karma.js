import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh as lwcLdsBindWireRefresh,
} from '@luvio/lwc-luvio';

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
