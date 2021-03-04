import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh,
} from '@luvio/lwc-luvio';
import { luvio } from 'lds-engine';

export function createWireAdapterConstructor(factory, metadata) {
    const { apiFamily, name } = metadata;
    const adapter = createLDSAdapter(name, factory);
    return lwcLdsCreateWireAdapterConstructor(adapter, `${apiFamily}.${name}`, luvio);
}

export function createLDSAdapter(name, factory) {
    return factory(luvio);
}

export const refresh = bindWireRefresh(luvio);
