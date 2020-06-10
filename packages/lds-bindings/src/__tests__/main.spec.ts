import { createWireAdapterConstructor, createLDSAdapter } from '../main';

jest.mock('@salesforce/lds-web-runtime', () => {
    return {
        lds: {},
    };
});

jest.mock('@ldsjs/lwc-lds', () => {
    const spies = {
        createWireAdapterConstructor: jest.fn(),
    };
    return {
        createWireAdapterConstructor: spies.createWireAdapterConstructor,
        __spies: spies,
    };
});

jest.mock('@salesforce/lds-instrumentation', () => {
    const spies = {
        instrumentAdapter: jest.fn(),
    };

    return {
        instrumentAdapter: spies.instrumentAdapter,
        __spies: spies,
    };
});

import { lds } from '@salesforce/lds-web-runtime';

import { createWireAdapterConstructor as lwcLdsCreateWireAdapterConstructor } from '@ldsjs/lwc-lds';

import { instrumentAdapter } from '@salesforce/lds-instrumentation';

beforeEach(() => {
    (instrumentAdapter as any).mockClear();
    (lwcLdsCreateWireAdapterConstructor as any).mockClear();
});

describe('createWireAdapterConstructor', () => {
    it('should invoke adapter factory', () => {
        const mockAdapter = {};
        const mockInstrumented = {};
        const mockWire = {};
        (instrumentAdapter as any).mockReturnValue(mockInstrumented);
        (lwcLdsCreateWireAdapterConstructor as any).mockReturnValue(mockWire);
        const factory = jest.fn().mockReturnValue(mockAdapter);

        const value = createWireAdapterConstructor('foo', factory);
        expect(factory).toHaveBeenCalled();
        expect(instrumentAdapter).toHaveBeenCalledWith('foo', mockAdapter);
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
