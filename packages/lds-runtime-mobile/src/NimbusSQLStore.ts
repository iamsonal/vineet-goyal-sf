// so eslint doesn't complain about nimbus
/* global __nimbus */

import { SQLEvaluatingStore } from '@salesforce/lds-graphql-eval';

export class NimbusSQLStore implements SQLEvaluatingStore {
    isEvalSupported(): boolean {
        return (
            __nimbus.plugins.LdsDurableStore.updateIndices !== undefined &&
            __nimbus.plugins.LdsDurableStore.evaluateSQL !== undefined
        );
    }

    updateIndices(indices: string[]): Promise<void> {
        return __nimbus.plugins.LdsDurableStore.updateIndices(indices);
    }

    evaluateSQL(sql: string): Promise<string> {
        return new Promise((resolve, reject) => {
            __nimbus.plugins.LdsDurableStore.evaluateSQL(sql, resolve, reject);
        });
    }
}
