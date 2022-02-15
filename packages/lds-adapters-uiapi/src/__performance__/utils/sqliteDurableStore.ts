import type { DatabaseConnection, DatabaseTransaction } from '@databases/sqlite';
import { sql } from '@databases/sqlite';

import type {
    DurableStore,
    DurableStoreEntries,
    OnDurableStoreChangedListener,
    DurableStoreOperation,
    DurableStoreChange,
} from '@luvio/environments';
import { DurableStoreOperationType } from '@luvio/environments';

export class SqliteMockDurableStore implements DurableStore {
    listeners = new Set<OnDurableStoreChangedListener>();
    private dbCreated: boolean = false;
    constructor(private db: DatabaseConnection) {}

    private async setupDb() {
        if (this.dbCreated) {
            return;
        }

        await this.db.query(
            sql`CREATE TABLE IF NOT EXISTS store (id INT PRIMARY KEY, key TEXT, value TEXT, segment TEXT)`
        );
        this.dbCreated = true;
    }

    async getEntries<T>(
        entryIds: string[],
        segment: string
    ): Promise<DurableStoreEntries<T> | undefined> {
        await this.setupDb();
        const returnSource = Object.create(null);

        const results = await this.db.query(
            sql`SELECT key, value FROM store WHERE key IN ${entryIds} AND WHERE segment=${segment};`
        );

        results.forEach((result) => {
            returnSource[result.key] = JSON.parse(result.value);
        });

        return returnSource;
    }

    async getAllEntries<T>(segment: string): Promise<DurableStoreEntries<T>> {
        await this.setupDb();
        const returnSource = Object.create(null);

        const results = await this.db.query(sql`SELECT * FROM store WHERE segment=${segment};`);

        results.forEach((result) => {
            returnSource[result.key] = JSON.parse(result.value);
        });

        return returnSource;
    }

    setEntries<T>(entries: DurableStoreEntries<T>, segment: string): Promise<void> {
        return this.batchOperations([
            { entries, segment, type: DurableStoreOperationType.SetEntries },
        ]);
    }

    evictEntries(ids: string[], segment: string): Promise<void> {
        return this.batchOperations([
            { ids, segment, type: DurableStoreOperationType.EvictEntries },
        ]);
    }

    registerOnChangedListener(listener: OnDurableStoreChangedListener): () => Promise<void> {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
            return Promise.resolve();
        };
    }

    async batchOperations<T>(operations: DurableStoreOperation<T>[]): Promise<void> {
        const changes: DurableStoreChange[] = [];
        await this.setupDb();

        await this.db.tx(async (transaction: DatabaseTransaction) => {
            for (let i = 0; i < operations.length; i++) {
                changes.push(await this.performOperation(operations[i], transaction));
            }
        });

        this.listeners.forEach((listener) => {
            listener(changes);
        });
    }

    async performOperation<T>(
        operation: DurableStoreOperation<T>,
        transaction: DatabaseTransaction
    ): Promise<DurableStoreChange> {
        const segment = operation.segment;
        let ids: string[] = [];
        switch (operation.type) {
            case DurableStoreOperationType.SetEntries:
                ids = Object.keys(operation.entries);
                await this.insertEntries(operation.entries, segment, transaction);
                break;
            case DurableStoreOperationType.EvictEntries:
                ids = operation.ids;
                await this.deleteEntries(ids, segment, transaction);
        }

        return { ids, segment, type: operation.type };
    }

    private async insertEntries(
        entries: Record<string, any>,
        segment: string,
        transaction: DatabaseTransaction
    ) {
        const ids = Object.keys(entries);
        const promises = ids.map(async (id) => {
            await transaction.query(
                sql`INSERT INTO store (key, value, segment) VALUES (${id}, ${JSON.stringify(
                    entries[id]
                )}, ${segment});`
            );
        });

        return Promise.all(promises);
    }

    private async deleteEntries(ids: string[], segment: string, transaction: DatabaseTransaction) {
        const promises = ids.map(async (id) => {
            await transaction.query(sql`DELETE FROM store WHERE key=${id} AND segment=${segment};`);
        });

        return Promise.all(promises);
    }
}
