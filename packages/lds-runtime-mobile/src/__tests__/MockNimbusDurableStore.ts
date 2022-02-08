import { BackingStore, JsNimbusDurableStore } from '@mobileplatform/nimbus-plugin-lds';
import * as sqlite from 'sqlite3';

export function mockNimbusStoreGlobal(mockNimbusStore: JsNimbusDurableStore) {
    global.__nimbus = {
        ...(global.__nimbus || {}),
        plugins: {
            ...(global.__nimbus?.plugins || {}),
            LdsDurableStore: mockNimbusStore,
        },
    } as any;
}

export function resetNimbusStoreGlobal() {
    global.__nimbus = undefined;
}

let db: sqlite.Database;
const createDB = () => {
    return new Promise<void>((resolve, _reject) => {
        db = new sqlite.Database(':memory:', () => resolve());
    });
};

beforeAll((done) => {
    createDB().then(done);
});
export class InMemoryBackingStore implements BackingStore {
    totalWorkCount = 0;
    inProgressWork: { [id: string]: Promise<any> } = {};

    conditions: { test: (key: string) => boolean; resolve: () => void }[] = [];

    flushPendingWork(): Promise<void> {
        return Promise.all(Object.values(this.inProgressWork)).then();
    }

    waitForSet(test: (key: string) => boolean): Promise<void> {
        return new Promise<void>((resolve) => {
            this.conditions.push({ test, resolve });
        });
    }

    get(key: string, segment: string): Promise<any> {
        const sql = getEntriesSql(segment, [key]);

        this.totalWorkCount += 1;
        const promiseId = `${this.totalWorkCount}`;
        const workPromise = new Promise<any>((resolve, _reject) => {
            db.all(sql, [key], (e, results) => {
                if (results === undefined || results.length === 0) {
                    resolve(undefined);
                    return;
                }

                return resolve(results[0].value);
            });
        }).finally(() => {
            delete this.inProgressWork[promiseId];
        });

        return (this.inProgressWork[promiseId] = workPromise);
    }

    set(key: string, segment: string, value: any): Promise<void> {
        const sql = setEntrySql(segment);
        const createSegmentSQL = createTableSql(segment);

        this.totalWorkCount += 1;
        const promiseId = `${this.totalWorkCount}`;

        const workPromise = new Promise<void>((resolve, reject) => {
            db.serialize(function () {
                db.run(createSegmentSQL);
                db.run(sql, [key, value], (e) => {
                    if (e !== null) {
                        reject(e);
                        return;
                    }

                    resolve();
                });
            });
        }).finally(() => {
            delete this.inProgressWork[promiseId];

            this.conditions.filter((c) => c.test(key)).forEach((c) => c.resolve());
        });

        return (this.inProgressWork[promiseId] = workPromise);
    }

    delete(key: string, segment: string): Promise<void> {
        const sql = deleteSql(segment);

        this.totalWorkCount += 1;
        const promiseId = `${this.totalWorkCount}`;

        const workPromise = new Promise<void>((resolve, reject) => {
            db.run(sql, [key], (e) => {
                if (e !== null) {
                    reject(e);
                    return;
                }
                resolve();
            });
        }).finally(() => {
            delete this.inProgressWork[promiseId];
        });

        return (this.inProgressWork[promiseId] = workPromise);
    }

    getAllKeys(segment: string): Promise<string[]> {
        const sql = getKeysSql(segment);

        this.totalWorkCount += 1;
        const promiseId = `${this.totalWorkCount}`;

        const workPromise = new Promise<string[]>((resolve, _reject) => {
            db.all(sql, [], (e, results) => {
                if (e !== null) {
                    resolve([]);
                    return;
                }

                return resolve(results.map((r) => r.key));
            });
        }).finally(() => {
            delete this.inProgressWork[promiseId];
        });

        return (this.inProgressWork[promiseId] = workPromise);
    }

    reset(): Promise<void> {
        return createDB();
    }
}

export class MockNimbusDurableStore extends JsNimbusDurableStore {
    constructor() {
        super(new InMemoryBackingStore());
    }

    set(key: string, segment: string, value: any): Promise<void> {
        return this.backingStore.set(key, segment, JSON.stringify(value));
    }

    flushPendingWork() {
        return (this.backingStore as InMemoryBackingStore).flushPendingWork();
    }

    waitForSet(test: (key: string) => boolean): Promise<void> {
        return (this.backingStore as InMemoryBackingStore).waitForSet(test);
    }
}

const deleteSql = (segment: string) => `
    DELETE FROM "${segment}" WHERE "${segment}".key = ?
`;

const createTableSql = (name: string) => `CREATE TABLE IF NOT EXISTS  "${name}" (
    key TEXT PRIMARY KEY,
    value TEXT
)`;

const setEntrySql = (segment: string) => `
    INSERT INTO '${segment}'(key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value;
`;

const getKeysSql = (table: string) => `
    SELECT "${table}".key
    FROM "${table}"
`;

const getEntriesSql = (table: string, keys: string[]) => `
    SELECT "${table}".key, "${table}".value
    FROM "${table}"
    WHERE "${table}".key
    IN (${keys.map(() => '?').join(', ')})
`;
