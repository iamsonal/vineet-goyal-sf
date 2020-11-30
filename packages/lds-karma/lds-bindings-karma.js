import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh,
} from '@luvio/lwc-luvio';
import { luvio } from 'lds-engine';

export function createWireAdapterConstructor(name, factory) {
    const adapter = createLDSAdapter(name, factory);
    return lwcLdsCreateWireAdapterConstructor(adapter, name, luvio);
}

export function createLDSAdapter(name, factory) {
    return factory(luvio);
}

export const refresh = bindWireRefresh(luvio);
