import { createWireAdapterConstructor, createLDSAdapter, refresh } from '../main';

jest.mock('@salesforce/lds-runtime-web', () => {
    return {
        lds: {
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

import { lds } from '@salesforce/lds-runtime-web';
import { __spies as instrumentationSpies } from '@salesforce/lds-instrumentation';
import { createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor } from '@luvio/lwc-luvio';
import { __spies as lwcLdsSpies } from '@luvio/lwc-luvio';

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

        const value = createWireAdapterConstructor('foo', factory);
        expect(factory).toHaveBeenCalled();
        expect(instrumentationSpies.instrumentAdapter).toHaveBeenCalledWith('foo', mockAdapter);
        expect(lwcLdsCreateWireAdapterConstructor).toHaveBeenCalledWith(
            mockInstrumented,
            'foo',
            lds
        );
        expect(value).toBe(mockWire);
    });
});

describe('createLDSAdapter', () => {
    it('should invoke adapter factory', () => {
        const mockAdapter = {};
        const factory = jest.fn().mockReturnValue(mockAdapter);

        const value = createLDSAdapter('foo', factory);
        expect(factory).toHaveBeenCalledWith(lds);
        expect(value).toBe(mockAdapter);
    });
});

describe('refresh', () => {
    it('should call function returned by bindWireRefresh', async () => {
        const data = {};
        await refresh(data, 'refreshUiApi');
        expect(lwcLdsSpies.bindWireRefreshSpy).toHaveBeenCalledWith(data);
    });
});
