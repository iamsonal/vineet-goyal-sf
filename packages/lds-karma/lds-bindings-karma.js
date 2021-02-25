import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh,
} from '@luvio/lwc-luvio';
import { luvio } from 'lds-engine';

export function createWireAdapterConstructor(factory, metadata) {
    const adapter = createLDSAdapter(metadata.name, factory);
    return lwcLdsCreateWireAdapterConstructor(adapter, metadata.name, luvio);
}

export function createLDSAdapter(name, factory) {
    return factory(luvio);
}

export const refresh = bindWireRefresh(luvio);
