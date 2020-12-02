import { Luvio, Store, Environment } from '@luvio/engine';
import AdsBridge from '../../dist/ads-bridge-perf';
import { ingestRecord, ingestObjectInfo } from '@salesforce/lds-adapters-uiapi';

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

describe('Luvio to ADS bridge', () => {
    benchmark('emitting single record without object info', () => {
        let luvio;
        let adsBridge;
        before(() => {
            const store = new Store();
            luvio = new Luvio(new Environment(store, () => new Promise(() => {})));
            adsBridge = new AdsBridge(luvio);
            const time = Date.now();

            ingestRecord(
                cloneRecord(mockRecord),
                { fullPath: 'record', parent: null },
                luvio,
                store,
                time
            );

            adsBridge.receiveFromLdsCallback = () => {};
        });

        run(() => {
            luvio.storeBroadcast();
        });
    });

    benchmark('emitting single record with object info', () => {
        let luvio;
        let adsBridge;
        before(() => {
            const store = new Store();
            luvio = new Luvio(new Environment(store, () => new Promise(() => {})));
            adsBridge = new AdsBridge(luvio);
            const time = Date.now();

            ingestObjectInfo(
                cloneObjectInfo(mockObjectInfo),
                { fullPath: 'object-info', parent: null },
                luvio,
                store,
                time
            );
            ingestRecord(
                cloneRecord(mockRecord),
                { fullPath: 'record', parent: null },
                luvio,
                store,
                time
            );

            adsBridge.receiveFromLdsCallback = () => {};
        });

        run(() => {
            luvio.storeBroadcast();
        });
    });
});
