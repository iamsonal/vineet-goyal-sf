beforeEach(() => {
    jest.resetModules();

    jest.mock('@luvio/engine');
    jest.mock('@salesforce/lds-network-aura', () => ({
        __esModule: true,
        default: jest.fn(),
    }));

    delete (global as any).$A;
    delete (global as any).window;
});

describe('sfdc lds-default-luvio', () => {
    it('does nothing when $A is not defined', () => {
        (global as any).window = {
            location: {
                href: 'auratest/test.app',
            },
        };

        const { Luvio } = require('@luvio/engine');
        require('../sfdc');
        expect(Luvio).not.toHaveBeenCalled();
    });

    it('does nothing when mode does not contain "AUTOJSTEST"', () => {
        (global as any).$A = {
            getContext: () => ({
                getMode: () => 'JSTEST',
            }),
        };
        (global as any).window = {
            location: {
                href: 'auratest/test.app',
            },
        };

        const { Luvio } = require('@luvio/engine');
        require('../sfdc');
        expect(Luvio).not.toHaveBeenCalled();
    });

    it('does nothing when context.test defined', () => {
        (global as any).$A = {
            getContext: () => ({
                getMode: () => 'AUTOJSTEST',
            }),
        };

        const { Luvio } = require('@luvio/engine');
        require('../sfdc');
        expect(Luvio).not.toHaveBeenCalled();
    });

    it('sets default luvio for Aura component tests', () => {
        (global as any).$A = {
            getContext: () => ({
                getMode: () => 'AUTOJSTEST',
                test: 'some-truthy-value',
            }),
        };

        const { Luvio, Environment, Store } = require('@luvio/engine');
        const { withDefaultLuvio } = require('../sfdc');

        expect(Store).toHaveBeenCalledTimes(1);
        // ensure coverage for the no-op scheduler function
        Store.mock.calls[0][0].scheduler();
        expect(Environment).toHaveBeenCalledTimes(1);
        expect(Luvio).toHaveBeenCalledTimes(1);

        let defaultLuvio;
        withDefaultLuvio((luvio) => (defaultLuvio = luvio));

        expect(defaultLuvio).toBe(Luvio.mock.instances[0]);
    });
});
