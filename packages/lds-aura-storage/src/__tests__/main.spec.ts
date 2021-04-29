beforeEach(() => {
    jest.resetModules();
});

describe('createStorage', () => {
    it('returns null if auraStorage.initStorage is not a function', () => {
        jest.mock('aura-storage', () => ({}));
        const storage = require('../main');
        expect(storage.createStorage({ name: 'test' })).toBeNull();
    });

    it('returns null if the created storage is not persistent', () => {
        jest.mock('aura-storage', () => ({
            initStorage: () => ({
                isPersistent: () => false,
            }),
        }));
        const storage = require('../main');
        expect(storage.createStorage({ name: 'test' })).toBeNull();
    });

    it('deletes storage if the created storage is not persistent', () => {
        const mockDeleteStorage = jest.fn().mockResolvedValue(null);
        const testStorageName = 'test';
        jest.mock('aura-storage', () => ({
            initStorage: () => ({
                isPersistent: () => false,
            }),
            deleteStorage: mockDeleteStorage,
        }));
        const storage = require('../main');
        expect(storage.createStorage({ name: testStorageName })).toBeNull();
        expect(mockDeleteStorage).toHaveBeenCalledWith(testStorageName);
    });

    it('returns a persistent storage', () => {
        jest.mock('aura-storage', () => ({
            initStorage: () => ({
                isPersistent: () => true,
            }),
        }));
        const storage = require('../main');
        expect(storage.createStorage({ name: 'test' }).isPersistent()).toBe(true);
    });
});

describe('resetStorages', () => {
    it('invokes clear on all the created storages', async () => {
        jest.mock('aura-storage', () => ({
            initStorage: () => ({
                isPersistent: () => true,
                clear: jest.fn().mockResolvedValueOnce(null),
            }),
        }));
        const storage = require('../main');

        const storageA = storage.createStorage({ name: 'A' });
        const storageB = storage.createStorage({ name: 'B' });

        await storage.clearStorages();

        expect(storageA.clear).toHaveBeenCalled();
        expect(storageB.clear).toHaveBeenCalled();
    });

    it('invokes clear on all the created storages, handles clear promise reject', async () => {
        jest.mock('aura-storage', () => ({
            initStorage: () => ({
                isPersistent: () => true,
                clear: jest
                    .fn()
                    .mockRejectedValue(
                        new Error(
                            'IDBDatabase.transaction: Cant start a transaction on a closed database'
                        )
                    ),
            }),
        }));
        const storage = require('../main');

        const storageA = storage.createStorage({ name: 'A' });
        const storageB = storage.createStorage({ name: 'B' });

        await storage.clearStorages();

        expect(storageA.clear).toHaveBeenCalled();
        expect(storageB.clear).toHaveBeenCalled();
    });
});
