import { Luvio } from '@luvio/engine';
import { createWireAdapterConstructor, createLDSAdapter, bindWireRefresh, refresh } from '../main';

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

jest.mock('@salesforce/lds-instrumentation', () => {
    const spies = {
        instrumentAdapter: jest.fn(),
    };
    return {
        instrumentation: {
            instrumentAdapter: spies.instrumentAdapter,
        },
        refreshApiEvent: () => {},
        __spies: spies,
    };
});

import {
    __spies as instrumentationSpies,
    REFRESH_UIAPI_KEY,
} from '@salesforce/lds-instrumentation';
import {
    createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor,
    __spies as lwcLuvioSpies,
} from '@luvio/lwc-luvio';

beforeEach(() => {
    instrumentationSpies.instrumentAdapter.mockClear();
    (lwcLdsCreateWireAdapterConstructor as any).mockClear();
});

describe('createWireAdapterConstructor', () => {
    it('should invoke adapter factory', () => {
        const luvio = {} as Luvio;
        const mockAdapter = {};
        const mockInstrumented = {};
        const mockWire = {};
        instrumentationSpies.instrumentAdapter.mockReturnValue(mockInstrumented);
        (lwcLdsCreateWireAdapterConstructor as any).mockReturnValue(mockWire);
        const factory = jest.fn().mockReturnValue(mockAdapter);

        const value = createWireAdapterConstructor(luvio, factory, {
            apiFamily: 'bar',
            name: 'foo',
        });

        expect(factory).toHaveBeenCalledWith(luvio);
        expect(instrumentationSpies.instrumentAdapter).toHaveBeenCalledWith(mockAdapter, {
            apiFamily: 'bar',
            name: 'foo',
        });
        expect(lwcLdsCreateWireAdapterConstructor).toHaveBeenCalledWith(
            mockInstrumented,
            'bar.foo',
            luvio
        );
        expect(value).toBe(mockWire);
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
        const luvio = ({
            instrument: jest.fn(),
        } as unknown) as Luvio;
        const data = {};
        bindWireRefresh(luvio);

        await refresh(data, REFRESH_UIAPI_KEY);

        expect(lwcLuvioSpies.bindWireRefreshSpy).toHaveBeenCalledWith(data);
    });
});
