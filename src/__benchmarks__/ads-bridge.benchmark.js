import { LDS, Store } from '@salesforce-lds/engine';
import AdsBridge from '../../dist/ads-bridge';
import { ingestRecord, ingestObjectInfo } from '@salesforce-lds-api/uiapi-records';

import mockObjectInfo from './mocks/custom-proto-medium-object-info';
import mockRecord from './mocks/custom-proto-medium-record';

function cloneObjectInfo(data) {
    return JSON.parse(data);
}

function cloneRecord(data) {
    const copy = JSON.parse(data);
    copy.id = `aJ9x00000000001CA0`;

    Object.keys(copy.fields).forEach((key, index) => {
        const field = copy.fields[key];
        if (field.value && field.value.id) {
            field.value.id = `aJ9x00000000001C0${index}`;
        }
    });

    return copy;
}

describe('LDS to ADS bridge', () => {
    benchmark('emitting single record without object info', () => {
        let lds;
        let adsBridge;
        before(() => {
            const store = new Store();
            lds = new LDS(store, () => new Promise(() => {}));
            adsBridge = new AdsBridge(lds);
            const time = Date.now();

            ingestRecord(
                cloneRecord(mockRecord),
                { fullPath: 'record', parent: null },
                lds,
                store,
                time
            );

            adsBridge.receiveFromLdsCallback = () => {};
        });

        run(() => {
            lds.storeBroadcast();
        });
    });

    benchmark('emitting single record with object info', () => {
        let lds;
        let adsBridge;
        before(() => {
            const store = new Store();
            lds = new LDS(store, () => new Promise(() => {}));
            adsBridge = new AdsBridge(lds);
            const time = Date.now();

            ingestObjectInfo(
                cloneObjectInfo(mockObjectInfo),
                { fullPath: 'object-info', parent: null },
                lds,
                store,
                time
            );
            ingestRecord(
                cloneRecord(mockRecord),
                { fullPath: 'record', parent: null },
                lds,
                store,
                time
            );

            adsBridge.receiveFromLdsCallback = () => {};
        });

        run(() => {
            lds.storeBroadcast();
        });
    });
});
