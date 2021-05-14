beforeEach(() => {
    jest.resetModules();
});

describe('setDefaultLuvio', () => {
    it('accepts just a NetworkAdapter', () => {
        jest.mock('@luvio/engine');
        const { Luvio, Environment } = require('@luvio/engine');
        const { setDefaultLuvio } = require('../main');

        const networkAdapter = Object.create(null);

        setDefaultLuvio({ networkAdapter });

        expect(Environment).toHaveBeenCalledWith(expect.anything(), networkAdapter);

        expect(Luvio.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(Luvio).toHaveBeenCalledWith(Environment.mock.instances[0]);
    });

    it('accepts a Store and a NetworkAdapter', () => {
        jest.mock('@luvio/engine');
        const { Luvio, Environment, Store } = require('@luvio/engine');
        const { setDefaultLuvio } = require('../main');

        const networkAdapter = Object.create(null);
        const store = Object.create(null);

        setDefaultLuvio({ networkAdapter, store });

        expect(Store).not.toHaveBeenCalled();
        expect(Environment).toHaveBeenCalledWith(store, networkAdapter);

        expect(Luvio.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(Luvio).toHaveBeenCalledWith(Environment.mock.instances[0]);
    });

    it('accepts just an Environment', () => {
        jest.mock('@luvio/engine');
        const { Luvio, Environment } = require('@luvio/engine');
        const { setDefaultLuvio } = require('../main');

        const environment = Object.create(null);

        setDefaultLuvio({ environment });

        expect(Environment).not.toHaveBeenCalled();

        expect(Luvio.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(Luvio).toHaveBeenCalledWith(environment);
    });

    it('accepts just a Luvio', () => {
        jest.mock('@luvio/engine');
        const { Luvio } = require('@luvio/engine');
        const { setDefaultLuvio } = require('../main');

        const luvio = Object.create(null);

        setDefaultLuvio({ luvio });

        expect(Luvio).not.toHaveBeenCalled();
    });

    it('throws an error if insufficient parameters are supplied', () => {
        const { setDefaultLuvio } = require('../main');
        expect(() => {
            setDefaultLuvio({});
        }).toThrowError();
    });
});

describe('withDefaultLuvio', () => {
    it('invokes the callback if the default luvio was previously set', (done) => {
        const { setDefaultLuvio, withDefaultLuvio } = require('../main');
        const luvio = Object.create(null);

        setDefaultLuvio({ luvio });
        withDefaultLuvio((x) => {
            expect(x).toBe(luvio);
            done();
        });
    });

    it('does not invoke the callback when the default luvio has not been set', () => {
        const { withDefaultLuvio } = require('../main');
        const callback = jest.fn();

        withDefaultLuvio(callback);

        expect(callback).not.toHaveBeenCalled();
    });

    it('invokes the callback when the default luvio is subsequently set', (done) => {
        const { setDefaultLuvio, withDefaultLuvio } = require('../main');
        const luvio = Object.create(null);

        const callback = jest.fn((x) => {
            expect(x).toBe(luvio);
            done();
        });

        withDefaultLuvio(callback);
        expect(callback).not.toHaveBeenCalled();

        setDefaultLuvio({ luvio });
    });

    it('invokes all callbacks when the default luvio is set', (done) => {
        const { setDefaultLuvio, withDefaultLuvio } = require('../main');
        const luvio = Object.create(null);

        const sawLuvio = [false, false, false];

        sawLuvio.forEach((_, i) => {
            withDefaultLuvio((x) => {
                expect(x).toBe(luvio);
                expect(sawLuvio[i]).toBe(false);

                sawLuvio[i] = true;

                if (sawLuvio.every((y) => y)) {
                    done();
                }
            });
        });

        expect(sawLuvio).not.toContain(true);

        setDefaultLuvio({ luvio });
    });

    it('invokes all callbacks when the default luvio is changed', (done) => {
        const { setDefaultLuvio, withDefaultLuvio } = require('../main');
        const luvio1 = Object.create(null);
        const luvio2 = Object.create(null);

        const sawLuvio1 = [false, false, false];
        const sawLuvio2 = [];

        sawLuvio1.forEach((_, i) => {
            sawLuvio2[i] = false;
            withDefaultLuvio((x) => {
                if (x === luvio1) {
                    expect(sawLuvio1[i]).toBe(false);
                    sawLuvio1[i] = true;
                } else if (x === luvio2) {
                    expect(sawLuvio1[i]).toBe(true);
                    sawLuvio2[i] = true;
                } else {
                    throw new Error('unexpected luvio instance received by callback');
                }

                if (sawLuvio1.every((y) => y) && sawLuvio2.every((y) => y)) {
                    done();
                }
            });
        });

        expect(sawLuvio1).not.toContain(true);
        expect(sawLuvio2).not.toContain(true);

        setDefaultLuvio({ luvio: luvio1 });
        setDefaultLuvio({ luvio: luvio2 });
    });
});
