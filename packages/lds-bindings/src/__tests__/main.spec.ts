import { Adapter, Luvio } from '@luvio/engine';
import { WireAdapterConstructor } from '@lwc/engine-core';

import {
    createWireAdapterConstructor,
    createInfiniteScrollingWireAdapterConstructor,
    createLDSAdapter,
    createInstrumentedAdapter,
    bindWireRefresh,
    refresh,
} from '../main';
import { instrumentation } from '../instrumentation';

import * as lwcLuvio from '@luvio/lwc-luvio';

const instrumentationSpies = {
    instrumentAdapter: jest.spyOn(instrumentation, 'instrumentAdapter'),
    refreshCalled: jest.spyOn(instrumentation, 'refreshCalled'),
};

afterEach(() => {
    jest.clearAllMocks();
});

describe('createWireAdapterConstructor', () => {
    it('should call lwc-luvio createWireAdapterConstructor', () => {
        const luvio = {} as Luvio;
        const adapter = jest.fn();
        const mockWire = {} as WireAdapterConstructor;
        const spyCreateWireAdapterConstructor = jest.spyOn(
            lwcLuvio,
            'createWireAdapterConstructor'
        );
        spyCreateWireAdapterConstructor.mockReturnValue(mockWire);

        const value = createWireAdapterConstructor(luvio, adapter, {
            apiFamily: 'bar',
            name: 'foo',
        });

        expect(spyCreateWireAdapterConstructor).toHaveBeenCalledWith(adapter, 'bar.foo', luvio);
        expect(value).toBe(mockWire);
    });
});

describe('createInfiniteScrollingWireAdapterConstructor', () => {
    it('should call lwc-luvio createInfiniteScrollingWireAdapterConstructor', () => {
        const luvio = {} as Luvio;
        const adapter = jest.fn();
        const mockWire = {} as WireAdapterConstructor;
        const spyCreateInfiniteScrollingWireAdapterConstructor = jest.spyOn(
            lwcLuvio,
            'createInfiniteScrollingWireAdapterConstructor'
        );
        spyCreateInfiniteScrollingWireAdapterConstructor.mockReturnValue(mockWire);

        const value = createInfiniteScrollingWireAdapterConstructor(luvio, adapter, {
            apiFamily: 'bar',
            name: 'foo',
        });

        expect(spyCreateInfiniteScrollingWireAdapterConstructor).toHaveBeenCalledWith(
            adapter,
            'bar.foo',
            luvio
        );
        expect(value).toBe(mockWire);
    });
});

describe('createInstrumentedAdapter', () => {
    it('should return an instrumented adapter', () => {
        const mockAdapter = {} as Adapter<unknown, unknown>;
        const metadata = {
            apiFamily: 'bar',
            name: 'foo',
        };
        const mockInstrumented: any = {};
        instrumentationSpies.instrumentAdapter.mockReturnValue(mockInstrumented);

        const value = createInstrumentedAdapter(mockAdapter, metadata);

        expect(instrumentationSpies.instrumentAdapter).toHaveBeenCalledWith(mockAdapter, metadata);
        expect(value).toBe(mockInstrumented);
    });
});

describe('createLDSAdapter', () => {
    it('should invoke adapter factory', () => {
        const luvio = {} as Luvio;
        const mockAdapter = {};
        const factory = jest.fn().mockReturnValue(mockAdapter);

        const value = createLDSAdapter(luvio, 'foo', factory);

        expect(factory).toHaveBeenCalledWith(luvio);
        expect(value).toBe(mockAdapter);
    });
});

describe('refresh', () => {
    it('should call function returned by bindWireRefresh', async () => {
        const data = {};

        const mockWireRefreh = jest.fn();
        const spyBindWireRefresh = jest.spyOn(lwcLuvio, 'bindWireRefresh');
        spyBindWireRefresh.mockReturnValue(mockWireRefreh);

        bindWireRefresh({} as Luvio);
        await refresh(data, 'refreshUiApi');

        expect(mockWireRefreh).toHaveBeenCalledWith(data);
    });
});
