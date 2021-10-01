import { Adapter, Luvio } from '@luvio/engine';
import {
    createWireAdapterConstructor,
    createLDSAdapter,
    createInstrumentedAdapter,
    bindWireRefresh,
    refresh,
} from '../main';

jest.mock('@luvio/lwc-luvio', () => {
    const spies = {
        createWireAdapterConstructor: jest.fn(),
        bindWireRefreshSpy: jest.fn(),
    };
    return {
        createWireAdapterConstructor: spies.createWireAdapterConstructor,
        bindWireRefresh: () => spies.bindWireRefreshSpy,
        __spies: spies,
    };
});

import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    __spies as lwcLuvioSpies,
} from '@luvio/lwc-luvio';

import { instrumentation } from '../instrumentation';

const instrumentationSpies = {
    instrumentAdapter: jest.spyOn(instrumentation, 'instrumentAdapter'),
    refreshCalled: jest.spyOn(instrumentation, 'refreshCalled'),
};

beforeEach(() => {
    instrumentationSpies.refreshCalled.mockClear();
    instrumentationSpies.instrumentAdapter.mockClear();
    (lwcLdsCreateWireAdapterConstructor as any).mockClear();
});

describe('createWireAdapterConstructor', () => {
    it('should invoke adapter factory', () => {
        const luvio = {} as Luvio;
        const adapter = jest.fn();
        const mockWire = {};
        (lwcLdsCreateWireAdapterConstructor as any).mockReturnValue(mockWire);

        const value = createWireAdapterConstructor(luvio, adapter, {
            apiFamily: 'bar',
            name: 'foo',
        });

        expect(lwcLdsCreateWireAdapterConstructor).toHaveBeenCalledWith(adapter, 'bar.foo', luvio);
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
        const luvio = {
            instrument: jest.fn(),
        } as unknown as Luvio;
        const data = {};
        bindWireRefresh(luvio);

        await refresh(data, 'refreshUiApi');

        expect(lwcLuvioSpies.bindWireRefreshSpy).toHaveBeenCalledWith(data);
    });
});
