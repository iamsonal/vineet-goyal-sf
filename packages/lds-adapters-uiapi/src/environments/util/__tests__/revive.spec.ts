import { reviveRecordsFromDurableStore } from '../revive';
import { Store } from '@ldsjs/engine';
import { MockDurableStore } from '@ldsjs/adapter-test-library';

describe('revive', () => {
    it('should revive all requested records', async () => {
        const store = new Store();
        const durableStore = new MockDurableStore();
        const fooData = {
            foo: true,
        };
        const barData = {
            bar: true,
        };
        durableStore.entries['foo'] = {
            data: fooData,
        };
        durableStore.entries['bar'] = {
            data: barData,
        };
        await reviveRecordsFromDurableStore({ foo: true, bar: true }, store, durableStore);
        expect(store.records['foo']).toEqual(fooData);
        expect(store.records['bar']).toEqual(barData);
    });
    it('should only revive records not already in the store', async () => {
        const store = new Store();
        const fooData = {
            foo: true,
        };
        const storeBarData = {
            baz: true,
        };
        const durableBarData = {
            bar: true,
        };

        store.records['bar'] = storeBarData;
        const durableStore = new MockDurableStore();
        durableStore.entries['foo'] = {
            data: fooData,
        };
        durableStore.entries['bar'] = {
            data: durableBarData,
        };
        await reviveRecordsFromDurableStore({ foo: true, bar: true }, store, durableStore);
        expect(store.records['foo']).toEqual(fooData);
        expect(store.records['bar']).toEqual(storeBarData);
    });

    it('should revive expiration data', async () => {
        const store = new Store();
        const durableStore = new MockDurableStore();
        const expiration = {
            fresh: 100,
            stale: 100,
        };
        const fooData = {
            foo: true,
        };
        durableStore.entries['foo'] = {
            data: fooData,
            expiration,
        };
        await reviveRecordsFromDurableStore({ foo: true }, store, durableStore);
        expect(store.records['foo']).toEqual(fooData);
        expect(store.recordExpirations['foo']).toEqual(expiration);
    });

    it('should not insert data into the store if any requested data is not in the durable store', async () => {
        const store = new Store();
        const durableStore = new MockDurableStore();
        const fooData = {
            foo: true,
        };
        durableStore.entries['foo'] = {
            data: fooData,
        };
        await reviveRecordsFromDurableStore({ foo: true, bar: true }, store, durableStore);
        expect(store.records['foo']).toBeUndefined();
        expect(store.records['bar']).toBeUndefined();
    });

    it('should not overwrite store data written to store during async durable read', async () => {
        const store = new Store();
        const durableStore = new MockDurableStore();
        const durableFooData = {
            foo: true,
        };
        const storeFooData = {
            baz: true,
        };
        durableStore.getEntries = () =>
            Promise.resolve({
                foo: {
                    data: durableFooData,
                },
            });
        const promise = reviveRecordsFromDurableStore({ foo: true }, store, durableStore);
        // simulate a write to store during the async durable store getEntries call
        store.records['foo'] = storeFooData;
        await promise;
        expect(store.records['foo']).toEqual(storeFooData);
    });
});
