import { Luvio } from '@luvio/engine';
import { API_NAMESPACE, RECORD_REPRESENTATION_NAME } from '@salesforce/lds-uiapi-record-utils';
import { withDefaultLuvio } from '@salesforce/lds-runtime-mobile';

export function setUiApiRecordTTL(ttl: number): void {
    withDefaultLuvio((luvio: Luvio) => {
        luvio.storeSetTTLOverride(API_NAMESPACE, RECORD_REPRESENTATION_NAME, ttl);
    });
}

export function setMetadataTTL(ttl: number): void {
    withDefaultLuvio((luvio: Luvio) => {
        luvio.storeSetDefaultTTLOverride(ttl);
    });
}
