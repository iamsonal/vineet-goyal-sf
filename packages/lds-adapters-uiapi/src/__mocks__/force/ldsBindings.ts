import { Luvio } from '@luvio/engine';
import { createImperativeAdapter as ldsBindingsCreateImperativeAdapter } from '@salesforce/lds-bindings';

export function createLDSAdapter(luvio: Luvio, name: string, factory: any) {
    return factory(luvio);
}

export function createWireAdapterConstructor() {
    return jest.fn();
}

export function createInstrumentedAdapter(luvio: Luvio, factory: any, metadata: any) {
    return createLDSAdapter(luvio, metadata.name, factory);
}

export function createImperativeAdapter(luvio: any, adapter: any, metadata: any) {
    return ldsBindingsCreateImperativeAdapter(luvio, adapter, metadata);
}

export function bindWireRefresh() {}
