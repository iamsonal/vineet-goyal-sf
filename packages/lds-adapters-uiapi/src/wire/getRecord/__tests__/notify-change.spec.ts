import { Store, Luvio, Environment } from '@luvio/engine';
import { DefaultDurableSegment, makeDurable } from '@luvio/environments';
import { MockDurableStore } from '@luvio/adapter-test-library';
import { flushPromises, clone } from '@salesforce/lds-jest';

import recordAccount from './mockData/record-Account-fields-Account.Id,Account.Name.json';
import {
    keyBuilder,
    RecordRepresentationNormalized,
} from '../../../generated/types/RecordRepresentation';
import { notifyChangeFactory } from '../index';

const recordRepCacheEntry: RecordRepresentationNormalized = {
    ...recordAccount,
    fields: {
        Id: {
            __ref: `UiApi::RecordRepresentation:${recordAccount.id}__fields__Id`,
        },
        Name: {
            __ref: `UiApi::RecordRepresentation:${recordAccount.id}__fields__Name`,
        },
    },
};
const recordKey = keyBuilder({ recordId: recordRepCacheEntry.id });

describe('notify change', () => {
    describe('default environment', () => {
        it('does not refresh when record is not in store', async () => {
            const mockNetworkAdapter = jest.fn();
            const mockLds = new Luvio(new Environment(new Store(), mockNetworkAdapter));
            const getRecordNotifyChange = notifyChangeFactory(mockLds);

            getRecordNotifyChange([{ recordId: recordRepCacheEntry.id }]);
            await flushPromises();

            expect(mockNetworkAdapter).not.toHaveBeenCalled();
        });

        it('refreshes when record is in store', async () => {
            const store = new Store();
            store.records = { [recordKey]: recordRepCacheEntry };

            const mockNetworkAdapter = jest.fn().mockResolvedValueOnce({
                body: clone(recordAccount),
                status: 200,
                ok: true,
            });
            const mockLds = new Luvio(new Environment(store, mockNetworkAdapter));
            const getRecordNotifyChange = notifyChangeFactory(mockLds);

            getRecordNotifyChange([{ recordId: recordRepCacheEntry.id }]);
            await flushPromises();

            expect(mockNetworkAdapter).toHaveBeenCalledTimes(1);
        });
    });

    describe('makeDurable environment', () => {
        it('does not refresh when record is not in store', async () => {
            const mockNetworkAdapter = jest.fn();
            const mockLds = new Luvio(
                makeDurable(new Environment(new Store(), mockNetworkAdapter), {
                    durableStore: new MockDurableStore(),
                })
            );
            const getRecordNotifyChange = notifyChangeFactory(mockLds);

            getRecordNotifyChange([{ recordId: recordRepCacheEntry.id }]);
            await flushPromises();

            expect(mockNetworkAdapter).not.toHaveBeenCalled();
        });

        it('refreshes when record is in store', async () => {
            const durableStore = new MockDurableStore();
            await durableStore.persistence.set(DefaultDurableSegment, {
                [recordKey]: {
                    data: recordRepCacheEntry,
                },
            });

            const mockNetworkAdapter = jest.fn().mockResolvedValueOnce({
                body: clone(recordAccount),
                status: 200,
                ok: true,
            });
            const mockLds = new Luvio(
                makeDurable(new Environment(new Store(), mockNetworkAdapter), {
                    durableStore,
                })
            );
            const getRecordNotifyChange = notifyChangeFactory(mockLds);

            getRecordNotifyChange([{ recordId: recordRepCacheEntry.id }]);
            await flushPromises();

            expect(mockNetworkAdapter).toHaveBeenCalledTimes(1);
        });
    });
});
