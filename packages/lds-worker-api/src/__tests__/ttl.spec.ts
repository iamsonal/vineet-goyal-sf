import { luvio } from '@salesforce/lds-runtime-mobile';
import { API_NAMESPACE, RECORD_REPRESENTATION_NAME } from '@salesforce/lds-uiapi-record-utils';
import { setUiApiRecordTTL, setMetadataTTL } from '../ttl';

async function mockImportChain() {
    let mockProvideLuvio = (_mockLuvio) => {
        throw new Error('Test error: withDefaultLuvio not called yet');
    };
    const storeSetTTLOverrideSpy = jest.fn();
    const storeSetDefaultTTLOverrideSpy = jest.fn();
    const mockLuvio = {
        storeSetDefaultTTLOverride: storeSetDefaultTTLOverrideSpy,
        storeSetTTLOverride: storeSetTTLOverrideSpy,
    };
    jest.mock('@salesforce/lds-runtime-mobile', () => {
        const actual = jest.requireActual('@salesforce/lds-runtime-mobile');
        return {
            ...actual,
            withDefaultLuvio: (cb) => {
                mockProvideLuvio = cb;
            },
        };
    });
    const { setUiApiRecordTTL, setMetadataTTL } = await import('../ttl');
    return {
        storeSetTTLOverrideSpy,
        storeSetDefaultTTLOverrideSpy,
        setUiApiRecordTTL,
        setMetadataTTL,
        mockLuvio,
        mockProvideLuvio,
    };
}

describe('Configurable TTL', () => {
    describe('Before default luvio has been provided', () => {
        beforeEach(() => {
            jest.resetModules();
        });

        afterEach(() => {
            jest.resetModules();
        });
        describe('setUiApiRecordTTL', () => {
            it('calls luvio.storeSetTTLOverride with the right params', async () => {
                const { mockProvideLuvio, storeSetTTLOverrideSpy, setUiApiRecordTTL, mockLuvio } =
                    await mockImportChain();

                const TTL_VALUE = 1000;

                setUiApiRecordTTL(TTL_VALUE);
                expect(storeSetTTLOverrideSpy).not.toHaveBeenCalled();
                mockProvideLuvio(mockLuvio);
                expect(storeSetTTLOverrideSpy).toHaveBeenCalledTimes(1);
                expect(storeSetTTLOverrideSpy).toHaveBeenCalledWith(
                    API_NAMESPACE,
                    RECORD_REPRESENTATION_NAME,
                    TTL_VALUE
                );
            });

            it('calls luvio.storeSetTTLOverride with the right params when setUiApiRecordTTL invoked multiple times before luvio available', async () => {
                const { mockProvideLuvio, storeSetTTLOverrideSpy, setUiApiRecordTTL, mockLuvio } =
                    await mockImportChain();

                const TTL_VALUE = 1000;

                setUiApiRecordTTL(344);
                setUiApiRecordTTL(TTL_VALUE);
                expect(storeSetTTLOverrideSpy).not.toHaveBeenCalled();
                mockProvideLuvio(mockLuvio);
                expect(storeSetTTLOverrideSpy).toHaveBeenCalledTimes(1);
                expect(storeSetTTLOverrideSpy).toHaveBeenCalledWith(
                    API_NAMESPACE,
                    RECORD_REPRESENTATION_NAME,
                    TTL_VALUE
                );
            });
        });

        describe('setMetadataTTL', () => {
            it('calls luvio.storeSetDefaultTTLOverride with the right params', async () => {
                const {
                    mockProvideLuvio,
                    storeSetDefaultTTLOverrideSpy,
                    setMetadataTTL,
                    mockLuvio,
                } = await mockImportChain();

                const TTL_VALUE = 1000;
                setMetadataTTL(TTL_VALUE);
                expect(storeSetDefaultTTLOverrideSpy).not.toHaveBeenCalled();
                mockProvideLuvio(mockLuvio);
                expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledTimes(1);
                expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledWith(TTL_VALUE);
            });

            it('calls luvio.storeSetDefaultTTLOverride with the right params when setUiApiRecordTTL invoked multiple times before luvio available', async () => {
                const {
                    mockProvideLuvio,
                    storeSetDefaultTTLOverrideSpy,
                    setMetadataTTL,
                    mockLuvio,
                } = await mockImportChain();

                const TTL_VALUE = 1000;

                setMetadataTTL(344);
                setMetadataTTL(TTL_VALUE);
                expect(storeSetDefaultTTLOverrideSpy).not.toHaveBeenCalled();
                mockProvideLuvio(mockLuvio);
                expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledTimes(1);
                expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledWith(TTL_VALUE);
            });
        });
    });
    describe('After default luvio has been provided', () => {
        describe('setUiApiRecordTTL', () => {
            it('calls luvio.storeSetTTLOverride with the right params', () => {
                const TTL_VALUE = 1000;
                const storeSetDefaultTTLOverrideSpy = jest.spyOn(luvio, 'storeSetTTLOverride');

                setUiApiRecordTTL(TTL_VALUE);
                expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledTimes(1);
                expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledWith(
                    API_NAMESPACE,
                    RECORD_REPRESENTATION_NAME,
                    TTL_VALUE
                );
            });
        });

        describe('setMetadataTTL', () => {
            it('calls luvio.storeSetDefaultTTLOverride with the right params', () => {
                const TTL_VALUE = 1000;
                const storeSetDefaultTTLOverrideSpy = jest.spyOn(
                    luvio,
                    'storeSetDefaultTTLOverride'
                );

                setMetadataTTL(TTL_VALUE);
                expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledTimes(1);
                expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledWith(TTL_VALUE);
            });
        });
    });
});
