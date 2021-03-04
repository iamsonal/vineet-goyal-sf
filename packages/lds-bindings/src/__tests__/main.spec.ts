import { createWireAdapterConstructor, createLDSAdapter, refresh } from '../main';

jest.mock('@salesforce/lds-runtime-web', () => {
    return {
        luvio: {
            instrument: jest.fn(),
        },
    };
});

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

import { luvio } from '@salesforce/lds-runtime-web';
import {
    __spies as instrumentationSpies,
    REFRESH_UIAPI_KEY,
} from '@salesforce/lds-instrumentation';
import { createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor } from '@luvio/lwc-luvio';
import { __spies as lwcLuvioSpies } from '@luvio/lwc-luvio';

beforeEach(() => {
    instrumentationSpies.instrumentAdapter.mockClear();
    (lwcLdsCreateWireAdapterConstructor as any).mockClear();
});

describe('createWireAdapterConstructor', () => {
    it('should invoke adapter factory', () => {
        const mockAdapter = {};
        const mockInstrumented = {};
        const mockWire = {};
        instrumentationSpies.instrumentAdapter.mockReturnValue(mockInstrumented);
        (lwcLdsCreateWireAdapterConstructor as any).mockReturnValue(mockWire);
        const factory = jest.fn().mockReturnValue(mockAdapter);

        const value = createWireAdapterConstructor(factory, { apiFamily: 'bar', name: 'foo' });
        expect(factory).toHaveBeenCalled();
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
        const mockAdapter = {};
        const factory = jest.fn().mockReturnValue(mockAdapter);

        const value = createLDSAdapter('foo', factory);
        expect(factory).toHaveBeenCalledWith(luvio);
        expect(value).toBe(mockAdapter);
    });
});

describe('refresh', () => {
    it('should call function returned by bindWireRefresh', async () => {
        const data = {};
        await refresh(data, REFRESH_UIAPI_KEY);
        expect(lwcLuvioSpies.bindWireRefreshSpy).toHaveBeenCalledWith(data);
    });
});
