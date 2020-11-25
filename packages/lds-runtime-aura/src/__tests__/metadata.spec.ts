import { Store, Luvio, Environment } from '@luvio/engine';

import { setupMetadataWatcher } from '../metadata';
import { createObjectInfo, addObjectInfo } from './test-utils';

import * as ldsStorage from '@salesforce/lds-aura-storage';

function createMetadataWatcher() {
    const store = new Store();
    const environment = new Environment(store, () => Promise.resolve());
    const luvio = new Luvio(environment);

    setupMetadataWatcher(luvio);

    return { lds: luvio };
}

describe('setupMetadataWatcher', () => {
    it('should not do anything when ingesting twice the same object info', () => {
        const { lds } = createMetadataWatcher();

        jest.spyOn(ldsStorage, 'clearStorages');

        addObjectInfo(lds, createObjectInfo());
        addObjectInfo(lds, createObjectInfo());
        expect(ldsStorage.clearStorages).not.toHaveBeenCalled();
    });

    it('should clear existing storage when an object info change is detected', () => {
        const { lds } = createMetadataWatcher();

        jest.spyOn(ldsStorage, 'clearStorages');

        addObjectInfo(lds, createObjectInfo());
        addObjectInfo(lds, createObjectInfo({ label: 'updated', eTag: 'updated' }));
        expect(ldsStorage.clearStorages).toHaveBeenCalled();
    });
});
