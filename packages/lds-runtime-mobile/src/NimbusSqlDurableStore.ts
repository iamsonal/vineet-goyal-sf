// so eslint doesn't complain about nimbus
/* global __nimbus */

import type { SqlDurableStore } from '@salesforce/lds-store-sql';
import { NimbusDurableStore } from './NimbusDurableStore';

export class NimbusSqlDurableStore extends NimbusDurableStore implements SqlDurableStore {
    isEvalSupported(): boolean {
        return (
            __nimbus.plugins.LdsDurableStore.updateIndices !== undefined &&
            __nimbus.plugins.LdsDurableStore.evaluateSQL !== undefined
        );
    }

    updateIndices(indices: string[]): Promise<void> {
        return __nimbus.plugins.LdsDurableStore.updateIndices(indices);
    }

    evaluateSQL(sql: string, params: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            __nimbus.plugins.LdsDurableStore.evaluateSQL(sql, params, resolve, reject);
        });
    }
}
