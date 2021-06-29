import {
    assertNetworkCallCount,
    clearCache,
    clone,
    resetNetworkStub,
    resetTime,
    stripEtags,
    verifyImmutable,
    verifyMutable,
} from 'test-util';

beforeAll(() => {
    window.addEventListener('unhandledrejection', (event) => {
        fail(`Uncaught promise rejection in test: ${event.reason}\nStack:\n${event.reason.stack}`);
    });
});

beforeEach(() => {
    jasmine.addMatchers({
        toBeImmutable: () => {
            return {
                compare: (actual) => {
                    verifyImmutable(actual, '$');

                    return { pass: true };
                },
            };
        },

        toBeMutable: () => {
            return {
                compare: (actual) => {
                    verifyMutable(actual, '$');

                    return { pass: true };
                },
            };
        },

        toEqualSnapshotWithoutEtags: () => {
            return {
                compare: (actual, expected) => {
                    expect(actual).toEqual(stripEtags(clone(expected)));
                    expect(actual).toBeImmutable();

                    return { pass: true };
                },
            };
        },

        /**
         * expect the actual value contains expected error content on body property
         */
        toContainErrorResponse: () => {
            return {
                compare: (actual, expected) => {
                    expect(actual).toEqual(
                        jasmine.objectContaining({
                            body: expected,
                        })
                    );
                    expect(actual).toBeImmutable();
                    return { pass: true };
                },
            };
        },

        /**
         * temporary equality check that accounts for the extra nested .data; will be removed
         * once we transition to full snapshot unwrapping (W-9232436)
         */
        toEqualWithExtraNestedData: () => {
            return {
                compare: (actual, expected) => {
                    expect(actual.data).toEqual(expected);
                    const actualWithoutData = clone(actual);
                    delete actualWithoutData.data;
                    expect(actualWithoutData).toEqual(expected);
                    return { pass: true };
                },
            };
        },
    });

    clearCache();
    resetNetworkStub();
});

afterEach(() => {
    assertNetworkCallCount();
    resetTime();
});
