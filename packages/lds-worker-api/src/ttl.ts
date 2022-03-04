import type { Luvio } from '@luvio/engine';
import { API_NAMESPACE, RECORD_REPRESENTATION_NAME } from '@salesforce/lds-uiapi-record-utils';
import { withDefaultLuvio } from '@salesforce/lds-runtime-mobile';

let luvio: Luvio | undefined = undefined;

let uiApiRecordTTL: number | undefined;
let metadataTTL: number | undefined;

withDefaultLuvio((_luvio: Luvio) => {
    luvio = _luvio;
    if (uiApiRecordTTL !== undefined) {
        // Note: This should rarely get hit and the durable store implementation
        // should have read write synchronization to protect against race conditions

        // Here since we are on a synchronous path we cannot await the Promise
        setUiApiRecordTTL(uiApiRecordTTL);
    }
    if (metadataTTL !== undefined) {
        // Note: This should rarely get hit and the durable store implementation
        // should have read write synchronization to protect against race conditions

        // Here since we are on a synchronous path we cannot await the Promise
        setMetadataTTL(metadataTTL);
    }
});

export function setUiApiRecordTTL(ttl: number): Promise<void> {
    uiApiRecordTTL = ttl;

    if (luvio === undefined) {
        return Promise.resolve();
    }

    return luvio.storeSetTTLOverride(API_NAMESPACE, RECORD_REPRESENTATION_NAME, ttl);
}

export function setMetadataTTL(ttl: number): Promise<void> {
    metadataTTL = ttl;

    if (luvio === undefined) {
        return Promise.resolve();
    }

    return luvio.storeSetDefaultTTLOverride(ttl);
}
