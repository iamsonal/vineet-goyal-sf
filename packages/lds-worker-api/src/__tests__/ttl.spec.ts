import { luvio } from '@salesforce/lds-runtime-mobile';
import { API_NAMESPACE, RECORD_REPRESENTATION_NAME } from '@salesforce/lds-uiapi-record-utils';
import { setUiApiRecordTTL, setMetadataTTL } from '../ttl';

describe('Configurable TTL', () => {
    describe('setUiApiRecordTTL', () => {
        it('calls luvio.storeSetTTLOverride with the right params', () => {
            const TTL_VALUE = 1000;
            const storeSetTTLOverrideSpy = jest.spyOn(luvio, 'storeSetTTLOverride');

            setUiApiRecordTTL(TTL_VALUE);
            expect(storeSetTTLOverrideSpy).toHaveBeenCalledTimes(1);
            expect(storeSetTTLOverrideSpy).toHaveBeenCalledWith(
                API_NAMESPACE,
                RECORD_REPRESENTATION_NAME,
                TTL_VALUE
            );
        });
    });

    describe('setMetadataTTL', () => {
        it('calls luvio.storeSetDefaultTTLOverride with the right params', () => {
            const TTL_VALUE = 1000;
            const storeSetDefaultTTLOverrideSpy = jest.spyOn(luvio, 'storeSetDefaultTTLOverride');

            setMetadataTTL(TTL_VALUE);
            expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledTimes(1);
            expect(storeSetDefaultTTLOverrideSpy).toHaveBeenCalledWith(TTL_VALUE);
        });
    });
});
