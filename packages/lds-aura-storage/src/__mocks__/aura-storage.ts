const storages: { [name: string]: Storage } = {};

class Storage {
    _entries: { [key: string]: any } = {};

    get(key: string) {
        return Promise.resolve(this._entries[key]);
    }
    set(key: string, value: any) {
        this._entries[key] = value;
        return Promise.resolve();
    }
    clear() {
        this._entries = {};
        return Promise.resolve();
    }
    getSize() {
        return Promise.resolve(Object.keys(this._entries).length);
    }
    isPersistent() {
        return true;
    }
}

export default {
    initStorage({ name }: { name: string }) {
        if (!storages[name]) {
            storages[name] = new Storage();
        }

        return storages[name];
    },
    getStorage(name: string) {
        const storage = storages[name];

        if (!storage) {
            throw new Error(`Invalid store name ${name}`);
        }

        return storage;
    },
    deleteStorage(name: string) {
        delete storages[name];
    },
    async __reset() {
        for (const storage of Object.values(storages)) {
            await storage.clear();
        }
    },
};
