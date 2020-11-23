import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    bindWireRefresh,
} from '@luvio/lwc-luvio';
import { lds } from 'lds-engine';

export function createWireAdapterConstructor(name, factory) {
    const adapter = createLDSAdapter(name, factory);
    return lwcLdsCreateWireAdapterConstructor(adapter, name, lds);
}

export function createLDSAdapter(name, factory) {
    return factory(lds);
}

export const refresh = bindWireRefresh(lds);
