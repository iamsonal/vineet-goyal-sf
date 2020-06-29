/**
 * Inspired by https://www.npmjs.com/package/hashlru
 */
export class LRUCache {
    private oldCache: Map<string, any>;
    private newCache: Map<string, any>;
    private size: number;
    private limit: number;

    constructor(limit: number) {
        this.oldCache = new Map();
        this.newCache = new Map();
        this.size = 0;
        this.limit = limit;
    }

    private checkSize(): void {
        if (this.size >= this.limit) {
            this.size = 0;
            this.oldCache = this.newCache;
            this.newCache = new Map();
        }
    }

    public get(key: string): any {
        if (this.newCache.has(key)) {
            return this.newCache.get(key);
        } else if (this.oldCache.has(key)) {
            const value = this.oldCache.get(key);
            this.oldCache.delete(key);
            this.newCache.set(key, value);
            this.size += 1;
            this.checkSize();
            return value;
        }
        return undefined;
    }

    public set(key: string, value: any): void {
        if (this.newCache.has(key)) {
            this.newCache.set(key, value);
        } else {
            this.newCache.set(key, value);
            this.size += 1;
            this.checkSize();
        }
    }
}
