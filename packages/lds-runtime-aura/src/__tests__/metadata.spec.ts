import { Store, Luvio, Environment } from '@luvio/engine';

import { setupMetadataWatcher } from '../metadata';
import { createObjectInfo, addObjectInfo } from './test-utils';

import * as ldsStorage from '@salesforce/lds-aura-storage';

function createMetadataWatcher() {
    const store = new Store();
    const environment = new Environment(store, () => Promise.resolve());
    const luvio = new Luvio(environment);

    setupMetadataWatcher(luvio);

    return { luvio };
}

describe('setupMetadataWatcher', () => {
    it('should not do anything when ingesting twice the same object info', () => {
        const { luvio } = createMetadataWatcher();

        jest.spyOn(ldsStorage, 'clearStorages');

        addObjectInfo(luvio, createObjectInfo());
        addObjectInfo(luvio, createObjectInfo());
        expect(ldsStorage.clearStorages).not.toHaveBeenCalled();
    });

    it('should clear existing storage when an object info change is detected', () => {
        const { luvio } = createMetadataWatcher();

        jest.spyOn(ldsStorage, 'clearStorages');

        addObjectInfo(luvio, createObjectInfo());
        addObjectInfo(luvio, createObjectInfo({ label: 'updated', eTag: 'updated' }));
        expect(ldsStorage.clearStorages).toHaveBeenCalled();
    });
});
