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
export class InMemoryBackingStore implements BackingStore {
    totalWorkCount = 0;
    inProgressWork: { [id: string]: Promise<any> } = {};

    conditions: { test: (key: string) => boolean; resolve: () => void }[] = [];
    db: sqlite.Database;

    constructor() {
        this.db = new sqlite.Database(':memory:');
    }

    backup(): Promise<void> {
        return new Promise((resolve) => {
            const backup = (this.db as any).backup('backup.db');

            //-1 is sent to the underlying sqlite3_backup_step function
            //so that all remaining db pages are copied to the file.
            backup.step(-1, resolve);
            backup.finish();
        });
    }

    flushPendingWork(): Promise<void> {
        return Promise.all(Object.values(this.inProgressWork)).then();
    }

    waitForSet(test: (key: string) => boolean): Promise<void> {
        return new Promise<void>((resolve) => {
            this.conditions.push({ test, resolve });
        });
    }

    evaluateSQL(
        sql: string,
        params: string[],
        onResult: (result: string) => void,
        _onError: (message: string) => void
    ): Promise<void> {
        this.totalWorkCount += 1;
        const promiseId = `${this.totalWorkCount}`;
        const workPromise = new Promise<void>((resolve, _reject) => {
            const mappedParams = params.map(mapParams);
            this.db.all(sql, mappedParams, (e, results) => {
                if (results === undefined || results.length === 0) {
                    resolve(undefined);
                    onResult('');
                    return;
                }

                const values = Object.values(results[0]);

                if (values === undefined || values.length === 0) {
                    resolve(undefined);
                    onResult('');
                    return;
                }
                onResult(values[0] as any);
                resolve();
            });
        }).finally(() => {
            delete this.inProgressWork[promiseId];
        });

        this.inProgressWork[promiseId] = workPromise;

        return workPromise;
    }

    get(key: string, segment: string): Promise<any> {
        const sql = getEntriesSql(segment, [key]);

        this.totalWorkCount += 1;
        const promiseId = `${this.totalWorkCount}`;
        const workPromise = new Promise<any>((resolve, _reject) => {
            this.db.all(sql, [key], (e, results) => {
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
            this.db.serialize(function () {
                this.run(createSegmentSQL);
                this.run(sql, [key, value], (e) => {
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

        const workPromise = new Promise<void>((resolve, _reject) => {
            this.db.run(sql, [key], () => {
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
            this.db.all(sql, [], (e, results) => {
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
        //This is not implemented.  Instead a new instance of
        //InMemoryBackingStore should be created.
        return Promise.resolve();
    }
}

export class MockNimbusDurableStore extends JsNimbusDurableStore {
    constructor() {
        super(new InMemoryBackingStore());
    }

    backup(): Promise<void> {
        return (this.backingStore as InMemoryBackingStore).backup();
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

    resetStore(): Promise<void> {
        this.backingStore = new InMemoryBackingStore();
        return Promise.resolve();
    }
}

const keyColumnName = 'key';
const valueColumnName = 'value';
const deleteSql = (segment: string) => `
    DELETE FROM "${segment}" WHERE "${segment}".key = ?
`;

const createTableSql = (name: string) => `CREATE TABLE IF NOT EXISTS  "${name}" (
    ${keyColumnName} TEXT PRIMARY KEY,
    value TEXT
)`;

const setEntrySql = (segment: string) => `
    INSERT INTO '${segment}'(${keyColumnName}, ${valueColumnName}) VALUES (?, ?)
    ON CONFLICT(${keyColumnName}) DO UPDATE SET ${valueColumnName}=excluded.${valueColumnName};
`;

const getKeysSql = (table: string) => `
    SELECT "${table}".${keyColumnName}
    FROM "${table}"
`;

const getEntriesSql = (table: string, keys: string[]) => `
    SELECT "${table}".${keyColumnName}, "${table}".${valueColumnName}
    FROM "${table}"
    WHERE "${table}".${keyColumnName}
    IN (${keys.map(() => '?').join(', ')})
`;

const mapParams = (param: string) => {
    const numValue = Number.parseFloat(param);

    if (Number.isNaN(numValue) === false) {
        return numValue;
    }

    if (param === 'true') {
        return true;
    }

    if (param === 'false') {
        return false;
    }

    if (param.length > 1 && param.startsWith("'") && param.endsWith("'")) {
        return param.slice(1, -1);
    }

    return undefined;
};
