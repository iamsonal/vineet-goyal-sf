import * as bindingsExports from '../main';
import * as bindingsNoLwcExports from '../main-no-lwc';

jest.mock('@salesforce/lds-runtime-web', () => {
    return {
        lds: {},
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
        __spies: spies,
    };
});

describe('bindings-no-lwc', () => {
    it('has same exports as bindings module', () => {
        const nonLwcBindingsExports = Object.keys(bindingsNoLwcExports).sort();
        const lwcBindingsExports = Object.keys(bindingsExports).sort();
        expect(nonLwcBindingsExports).toEqual(lwcBindingsExports);
    });

    it('exports same createWireAdapterConstructor', () => {
        const {
            createWireAdapterConstructor: createWireAdapterConstructor_noLwc,
        } = bindingsNoLwcExports;
        const { createWireAdapterConstructor: createWireAdapterConstructor_lwc } = bindingsExports;
        expect(createWireAdapterConstructor_noLwc).toBe(createWireAdapterConstructor_lwc);
    });

    it('exports same createLDSAdapter', () => {
        const { createLDSAdapter: createLDSAdapter_noLwc } = bindingsNoLwcExports;
        const { createLDSAdapter: createLDSAdapter_lwc } = bindingsExports;
        expect(createLDSAdapter_noLwc).toBe(createLDSAdapter_lwc);
    });
});

describe('refresh', () => {
    it('throws error', () => {
        const { refresh } = bindingsNoLwcExports;
        expect(() => refresh()).toThrowError();
    });
});
