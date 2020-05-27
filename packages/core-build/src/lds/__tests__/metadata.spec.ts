import { Store, LDS, Environment } from '@ldsjs/engine';

import { createStorage } from '../storage';
import { setupMetadataWatcher } from '../metadata';
import { createObjectInfo, addObjectInfo } from './test-utils';

function createMetadataWatcher() {
    const store = new Store();
    const environment = new Environment(store, () => Promise.resolve());
    const lds = new LDS(environment);
    const storage = createStorage({ name: 'test' });

    setupMetadataWatcher(lds);

    return { store, lds, storage };
}

describe('setupMetadataWatcher', () => {
    it('should not do anything when ingesting twice the same object info', () => {
        const { lds, storage } = createMetadataWatcher();

        jest.spyOn(storage, 'clear');

        addObjectInfo(lds, createObjectInfo());
        addObjectInfo(lds, createObjectInfo());
        expect(storage.clear).not.toHaveBeenCalled();
    });

    it('should clear existing storage when an object info change is detected', () => {
        const { lds, storage } = createMetadataWatcher();

        jest.spyOn(storage, 'clear');

        addObjectInfo(lds, createObjectInfo());
        addObjectInfo(lds, createObjectInfo({ label: 'updated', eTag: 'updated' }));
        expect(storage.clear).toHaveBeenCalled();
    });
});
