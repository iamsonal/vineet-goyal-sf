import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestRecord, getRecordAdapterFactory } from '@salesforce/lds-adapters-uiapi';

import { WARM_UP_ITERATION_COUNT } from './shared';

let nextId = 0;

function createRecord(maxDepth, maxBreadth, recordIdPrefix, depth = 0) {
    const recordIdSuffix = String(nextId++).padStart(18 - recordIdPrefix.length, '0');
    const apiName = 'Perf';

    let fieldNames = [];
    const data = {
        id: recordIdPrefix + recordIdSuffix,
        apiName,
        childRelationships: {},
        eTag: '',
        fields: {},
        lastModifiedById: '',
        lastModifiedDate: '',
        recordTypeId: '',
        recordTypeInfo: null,
        systemModstamp: '',
        weakEtag: 0,
    };

    for (let i = 0; i < maxBreadth; i++) {
        const fieldName = `field${i}`;

        if (depth >= maxDepth) {
            fieldNames.push(fieldName);
            data.fields[fieldName] = {
                displayValue: `DisplayValue:${i}`,
                value: `Value:${i}`,
            };
        } else {
            const spanning = createRecord(maxDepth, maxBreadth, recordIdPrefix, depth + 1);

            fieldNames.push(
                ...spanning.fieldNames.map(
                    (spanningFieldName) => `${fieldName}.${spanningFieldName}`
                )
            );
            data.fields[fieldName] = {
                displayValue: spanning.data.id,
                value: spanning.data,
            };
        }
    }

    if (depth === 0) {
        fieldNames = fieldNames.map((fieldName) => `${apiName}.${fieldName}`);
    }

    return { data, fieldNames };
}

const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));

const store = new Store();
const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
const getRecord = getRecordAdapterFactory(luvio);

const deepRecord = createRecord(5, 3, 'deep'); // 729 fields
const wideRecord = createRecord(0, 500, 'wide'); // 500 fields
const balancedRecord = createRecord(3, 10, 'balanced'); // 10000 fields

ingestRecord(deepRecord.data, deepRecord.data.id, luvio, store);
ingestRecord(wideRecord.data, wideRecord.data.id, luvio, store);
ingestRecord(balancedRecord.data, balancedRecord.data.id, luvio, store);

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    getRecord({
        recordId: balancedRecord.data.id,
        fields: balancedRecord.fieldNames,
    });
}

describe('getRecord by fields', () => {
    benchmark('deep record', () => {
        run(() => {
            getRecord({
                recordId: deepRecord.data.id,
                fields: deepRecord.fieldNames,
            });
        });
    });

    benchmark('wide record', () => {
        run(() => {
            getRecord({
                recordId: wideRecord.data.id,
                fields: wideRecord.fieldNames,
            });
        });
    });

    benchmark('balanced record', () => {
        run(() => {
            getRecord({
                recordId: balancedRecord.data.id,
                fields: balancedRecord.fieldNames,
            });
        });
    });
});
