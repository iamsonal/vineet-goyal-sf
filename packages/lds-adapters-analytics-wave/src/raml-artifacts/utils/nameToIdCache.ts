export class NameToIdCache {
    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO: change this to a cross-session api (e.g. for offline mobile support)
    private cache: { [name: string]: string | undefined } = {};

    get(name: string): string | undefined {
        return this.cache[name.toLowerCase()];
    }

    set(name: string, id: string) {
        this.cache[name.toLowerCase()] = id;
    }

    remove(nameOrId: string) {
        const lowerName = nameOrId.toLowerCase();
        for (const key in this.cache) {
            if (key === lowerName || this.cache[key] === nameOrId) {
                delete this.cache[key];
            }
        }
    }

    clear() {
        this.cache = {};
    }
}
