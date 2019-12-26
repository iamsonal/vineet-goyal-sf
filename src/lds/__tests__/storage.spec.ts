beforeEach(() => {
    jest.resetModules();
});

describe('createStorage', () => {
    it('returns null if auraStorage.initStorage is not a function', () => {
        jest.mock('aura-storage', () => ({}));
        const storage = require('../storage');
        expect(storage.createStorage({ name: 'test' })).toBeNull();
    });

    it('returns null if the created storage is not persistent', () => {
        jest.mock('aura-storage', () => ({
            initStorage: () => ({
                isPersistent: () => false,
            }),
        }));
        const storage = require('../storage');
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
        const storage = require('../storage');
        expect(storage.createStorage({ name: testStorageName })).toBeNull();
        expect(mockDeleteStorage).toHaveBeenCalledWith(testStorageName);
    });

    it('returns a persistent storage', () => {
        jest.mock('aura-storage', () => ({
            initStorage: () => ({
                isPersistent: () => true,
            }),
        }));
        const storage = require('../storage');
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
        const storage = require('../storage');

        const storageA = storage.createStorage({ name: 'A' });
        const storageB = storage.createStorage({ name: 'B' });

        await storage.clearStorages();

        expect(storageA.clear).toHaveBeenCalled();
        expect(storageB.clear).toHaveBeenCalled();
    });
});
