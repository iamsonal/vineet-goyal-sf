import { Luvio } from '@luvio/engine';
import { API_NAMESPACE, RECORD_REPRESENTATION_NAME } from '@salesforce/lds-uiapi-record-utils';
import { withDefaultLuvio } from '@salesforce/lds-runtime-mobile';

let luvio: Luvio | undefined = undefined;

let uiApiRecordTTL: number | undefined;
let metadataTTL: number | undefined;

withDefaultLuvio((_luvio: Luvio) => {
    luvio = _luvio;
    if (uiApiRecordTTL !== undefined) {
        setUiApiRecordTTL(uiApiRecordTTL);
    }
    if (metadataTTL !== undefined) {
        setMetadataTTL(metadataTTL);
    }
});

export function setUiApiRecordTTL(ttl: number): void {
    uiApiRecordTTL = ttl;
    if (luvio !== undefined) {
        luvio.storeSetTTLOverride(API_NAMESPACE, RECORD_REPRESENTATION_NAME, ttl);
    }
}

export function setMetadataTTL(ttl: number): void {
    metadataTTL = ttl;
    if (luvio !== undefined) {
        luvio.storeSetDefaultTTLOverride(ttl);
    }
}
