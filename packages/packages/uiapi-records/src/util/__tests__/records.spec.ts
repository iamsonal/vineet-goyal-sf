import { Store, LDS } from '@salesforce-lds/engine';

import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import {
    ingest,
    keyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';
import {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getFieldValue,
    getRecordInput,
    getTrackedFields,
    isSuperset,
    extractTrackedFields,
} from '../records';

import record from './data/sampleRecord';
import recursiveRecord from './data/recursiveRecord';
import recursiveRecordDifferentPaths from './data/recursiveRecordDifferentPaths';
import objectInfo from './data/sampleObjectInfo';
import deepRecord from './data/sampleRecordDeep';

function buildSampleRecord(): RecordRepresentation {
    return JSON.parse(JSON.stringify(record));
}

function buildRecursiveRecord(): RecordRepresentation {
    return JSON.parse(JSON.stringify(recursiveRecord));
}

function buildRecursiveRecordDifferentPaths(): RecordRepresentation {
    return JSON.parse(JSON.stringify(recursiveRecordDifferentPaths));
}

function buildSampleObjectInfo(): ObjectInfoRepresentation {
    return JSON.parse(JSON.stringify(objectInfo));
}

function buildDeepRecord(): RecordRepresentation {
    return JSON.parse(JSON.stringify(deepRecord));
}

describe('getTrackedFields', () => {
    it('should return correct tracked fields', () => {
        const store = new Store();
        const lds = new LDS(store, () => Promise.reject());

        ingest(
            buildSampleRecord(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );
        const fields = getTrackedFields(lds, record.id, []);
        expect(fields).toEqual([
            'Account.CreatedDate',
            'Account.Name',
            'Account.Owner.City',
            'Account.Owner.Id',
            'Account.Owner.LastModifiedBy.Name',
            'Account.OwnerId',
        ]);
    });

    it('should include fields passed to getTrackedFields', () => {
        const store = new Store();
        const lds = new LDS(store, () => Promise.reject());

        ingest(
            buildSampleRecord(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );
        const fields = getTrackedFields(lds, record.id, ['Account.Foo']);
        expect(fields).toEqual([
            'Account.CreatedDate',
            'Account.Foo',
            'Account.Name',
            'Account.Owner.City',
            'Account.Owner.Id',
            'Account.Owner.LastModifiedBy.Name',
            'Account.OwnerId',
        ]);
    });

    it('should dedupe fields passed to getTrackedFields', () => {
        const store = new Store();
        const lds = new LDS(store, () => Promise.reject());

        ingest(
            buildSampleRecord(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );
        const fields = getTrackedFields(lds, record.id, ['Account.Name']);
        expect(fields).toEqual([
            'Account.CreatedDate',
            'Account.Name',
            'Account.Owner.City',
            'Account.Owner.Id',
            'Account.Owner.LastModifiedBy.Name',
            'Account.OwnerId',
        ]);
    });

    it('should resolve tracked fields on records with circular reference', () => {
        const store = new Store();
        const lds = new LDS(store, () => Promise.reject());

        ingest(
            buildRecursiveRecord(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );

        const fields = getTrackedFields(lds, recursiveRecord.id, []);
        expect(fields).toEqual(['User.CreatedById', 'User.Email', 'User.Id', 'User.Name']);
    });

    it('should resolve tracked fields on record with circular reference on a per-path basis', () => {
        const store = new Store();
        const lds = new LDS(store, () => Promise.reject());

        ingest(
            buildRecursiveRecordDifferentPaths(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );

        const fields = getTrackedFields(lds, recursiveRecordDifferentPaths.id, []);
        expect(fields).toEqual([
            'User.CreatedBy.CreatedById',
            'User.CreatedBy.Id',
            'User.CreatedBy.Name',
            'User.CreatedById',
            'User.Email',
            'User.Id',
            'User.LastModifiedBy.CreatedById',
            'User.LastModifiedBy.Id',
            'User.LastModifiedBy.Name',
            'User.LastModifiedById',
        ]);
    });

    it('should not include fields more than 6 levels deep', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const lds = new LDS(store, () => Promise.reject());

        ingest(
            record,
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );

        const fields = getTrackedFields(lds, record.id, []);
        expect(fields).toEqual([
            'TestD__c.TestC__c',
            'TestD__c.TestC__r.Id',
            'TestD__c.TestC__r.TestA__c',
            'TestD__c.TestC__r.TestA__r.Id',
            'TestD__c.TestC__r.TestA__r.Opportunity__c',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Id',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.CreatedById',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.Id',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHoursId',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.AccountId',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Id',
        ]);
    });
});

describe('extractTrackedFields', () => {
    it('should not include fields more than 6 levels deep', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const lds = new LDS(store, () => Promise.reject());
        const recordKey = keyBuilder({ recordId: record.id });
        ingest(record, { fullPath: recordKey, parent: null }, lds, store, 0);

        const node = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(recordKey);

        const fields = extractTrackedFields(node, record.apiName);
        expect(fields).toEqual([
            'TestD__c.TestC__c',
            'TestD__c.TestC__r.Id',
            'TestD__c.TestC__r.TestA__c',
            'TestD__c.TestC__r.TestA__r.Id',
            'TestD__c.TestC__r.TestA__r.Opportunity__c',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Id',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.CreatedById',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.Id',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHoursId',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.AccountId',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Id',
        ]);
    });
});

describe('generateRecordInputForCreate', () => {
    it('copies all non-nested fields if no objectInfo is passed', () => {
        const existingRecord = buildSampleRecord();

        const actualRecordInput = generateRecordInputForCreate(existingRecord);

        expect(actualRecordInput).toStrictEqual({
            apiName: existingRecord.apiName,
            fields: {
                CreatedDate: existingRecord.fields.CreatedDate.value,
                Name: existingRecord.fields.Name.value,
                OwnerId: existingRecord.fields.OwnerId.value,
            },
        });
    });

    it('filters out fields.Id', () => {
        const sampleRecord = buildSampleRecord();

        // add an 'Id' field to existing record
        const existingRecord = {
            ...sampleRecord,
            fields: {
                ...sampleRecord.fields,
                Id: {
                    displayValue: null,
                    value: '001T1000001nFt5IAE',
                },
            },
        } as RecordRepresentation;

        const actualRecordInput = generateRecordInputForCreate(existingRecord);

        expect(actualRecordInput).toStrictEqual({
            apiName: existingRecord.apiName,
            fields: {
                CreatedDate: existingRecord.fields.CreatedDate.value,
                Name: existingRecord.fields.Name.value,
                OwnerId: existingRecord.fields.OwnerId.value,
            },
        });
    });

    it('filters out read-only fields when a valid objectInfo is passed', () => {
        const existingRecord = buildSampleRecord();
        const objectInfoForRecord = buildSampleObjectInfo();

        const actualRecordInput = generateRecordInputForCreate(existingRecord, objectInfoForRecord);

        expect(actualRecordInput).toStrictEqual({
            apiName: existingRecord.apiName,
            fields: {
                Name: existingRecord.fields.Name.value,
                OwnerId: existingRecord.fields.OwnerId.value,
            },
        });
    });
});

describe('generateRecordInputForUpdate', () => {
    it('sets record.Id and copies all fields if no objectInfo is passed', () => {
        const existingRecord = buildSampleRecord();

        const actualRecordInput = generateRecordInputForUpdate(existingRecord);

        expect(actualRecordInput).toStrictEqual({
            apiName: undefined,
            fields: {
                CreatedDate: existingRecord.fields.CreatedDate.value,
                Id: existingRecord.id,
                Name: existingRecord.fields.Name.value,
                OwnerId: existingRecord.fields.OwnerId.value,
            },
        });
    });

    it('filters out read-only fields when a valid objectInfo is passed', () => {
        const existingRecord = buildSampleRecord();
        const objectInfoForRecord = buildSampleObjectInfo();

        const actualRecordInput = generateRecordInputForUpdate(existingRecord, objectInfoForRecord);

        expect(actualRecordInput).toStrictEqual({
            apiName: undefined,
            fields: {
                Id: existingRecord.id,
                Name: existingRecord.fields.Name.value,
                OwnerId: existingRecord.fields.OwnerId.value,
            },
        });
    });

    it('throws when existing record does not have an id', () => {
        const existingRecord = buildSampleRecord();
        delete existingRecord.id;
        expect(() => generateRecordInputForUpdate(existingRecord)).toThrowError(
            'record must have id for update'
        );
    });
});

describe('createRecordInputFilteredByEditedFields', () => {
    it('copies edited fields and Id with an existing record that has an id', () => {
        const existingRecord = buildSampleRecord();

        const recordInputForEdited = getRecordInput();
        recordInputForEdited.apiName = 'Opportunity';
        recordInputForEdited.fields = {
            Name: 'Bar', // changed
            Amount: '4000', // changed
            OwnerId: existingRecord.fields.OwnerId.value as string, // same value
        };
        const recordInputForEditFiltered = createRecordInputFilteredByEditedFields(
            recordInputForEdited,
            existingRecord
        );

        expect(recordInputForEditFiltered).toStrictEqual({
            // apiName should never be copied over.
            apiName: undefined,
            fields: {
                Id: existingRecord.id,
                Name: recordInputForEdited.fields.Name,
                Amount: recordInputForEdited.fields.Amount,
            },
        });
    });

    it('copies edited fields with an existing record that does not have an id', () => {
        const existingRecord = buildSampleRecord();
        delete existingRecord.id;

        const recordInputForEdited = getRecordInput();
        recordInputForEdited.apiName = 'Opportunity';
        recordInputForEdited.fields = {
            Name: 'Bar', // changed
        };
        const recordInputForEditFiltered = createRecordInputFilteredByEditedFields(
            recordInputForEdited,
            existingRecord
        );

        expect(recordInputForEditFiltered).toStrictEqual({
            // apiName should never be copied over.
            apiName: undefined,
            fields: {
                Name: recordInputForEdited.fields.Name,
            },
        });
    });
});

describe('getFieldValue and getFieldDisplayValue', () => {
    describe('getFieldValue', () => {
        it('returns field value for non-spanning FieldId', () => {
            const fieldId = { fieldApiName: 'Name', objectApiName: 'Account' };
            expect(getFieldValue(record, fieldId)).toBe('SFDX Account');
        });

        it('returns undefined for non-existent non-spanning FieldId', () => {
            const fieldId = {
                fieldApiName: 'Nonexistent',
                objectApiName: 'Account',
            };
            expect(getFieldValue(record, fieldId)).toBeUndefined();
        });

        it('returns field value for leaf spanning FieldId', () => {
            const fieldId = {
                fieldApiName: 'Owner.LastModifiedBy.Name',
                objectApiName: 'Account',
            };
            expect(getFieldValue(record, fieldId)).toBe('Frank');
        });

        it('returns field value for non-leaf spanning FieldId', () => {
            const fieldId = {
                fieldApiName: 'Owner.LastModifiedBy',
                objectApiName: 'Account',
            };
            expect(getFieldValue(record, fieldId)).toMatchObject({
                apiName: 'User',
                fields: { Name: { value: 'Frank' } },
            });
        });

        it('returns undefined for non-existent first field of spanning FieldId ', () => {
            const fieldId = {
                fieldApiName: 'Nonexistent.Nonexistent',
                objectApiName: 'Account',
            };
            expect(getFieldValue(record, fieldId)).toBeUndefined();
        });

        it('returns undefined for non-existent non-first field of spanning FieldId', () => {
            const fieldId = {
                fieldApiName: 'Owner.Nonexistent.Nonexistent',
                objectApiName: 'Account',
            };
            expect(getFieldValue(record, fieldId)).toBeUndefined();
        });

        it('returns field value for non-spanning string', () => {
            const field = 'Account.Name';
            expect(getFieldValue(record, field)).toBe('SFDX Account');
        });

        it('returns undefined for non-existent non-spanning string', () => {
            const field = 'Account.Nonexistent';
            expect(getFieldValue(record, field)).toBeUndefined();
        });

        it('returns field value for leaf spanning string', () => {
            const field = 'Account.Owner.LastModifiedBy.Name';
            expect(getFieldValue(record, field)).toBe('Frank');
        });

        it('returns field value for non-leaf spanning string', () => {
            const field = 'Account.Owner.LastModifiedBy';
            expect(getFieldValue(record, field)).toMatchObject({
                apiName: 'User',
                fields: { Name: { value: 'Frank' } },
            });
        });

        it('returns undefined for non-existent first field of spanning string', () => {
            const field = 'Account.Nonexistent.Nonexistent';
            expect(getFieldValue(record, field)).toBeUndefined();
        });

        it('returns undefined for non-existent non-first field of spanning string', () => {
            const field = 'Account.Owner.Nonexistent.Nonexistent';
            expect(getFieldValue(record, field)).toBeUndefined();
        });
    });

    describe('getFieldDisplayValue', () => {
        it('returns field display value for non-spanning FieldId', () => {
            const fieldId = { fieldApiName: 'Name', objectApiName: 'Account' };
            expect(getFieldDisplayValue(record, fieldId)).toBe('SFDX Account Display Value');
        });

        it('returns undefined for non-existent non-spanning FieldId', () => {
            const fieldId = { fieldApiName: 'Nonexistent', objectApiName: 'Account' };
            expect(getFieldDisplayValue(record, fieldId)).toBeUndefined();
        });

        it('returns field display value for leaf spanning FieldId', () => {
            const fieldId = {
                fieldApiName: 'Owner.LastModifiedBy.Name',
                objectApiName: 'Account',
            };
            expect(getFieldDisplayValue(record, fieldId)).toBe('Frank Leaf Display Value');
        });

        it('returns field display value for non-leaf spanning FieldId', () => {
            const fieldId = { fieldApiName: 'Owner.LastModifiedBy', objectApiName: 'Account' };
            expect(getFieldDisplayValue(record, fieldId)).toBe('Frank non-leaf Display Name');
        });

        it('returns undefined for non-existent first field of spanning FieldId ', () => {
            const fieldId = {
                fieldApiName: 'Nonexistent.Nonexistent',
                objectApiName: 'Account',
            };
            expect(getFieldDisplayValue(record, fieldId)).toBeUndefined();
        });

        it('returns undefined for non-existent non-first field of spanning FieldId', () => {
            const fieldId = {
                fieldApiName: 'Owner.LastModifiedBy.Nonexistent.Nonexistent',
                objectApiName: 'Account',
            };
            expect(getFieldDisplayValue(record, fieldId)).toBeUndefined();
        });

        it('returns field display value for non-spanning string', () => {
            const field = 'Account.Name';
            expect(getFieldDisplayValue(record, field)).toBe('SFDX Account Display Value');
        });

        it('returns undefined for non-existent non-spanning string', () => {
            const field = 'Account.Nonexistent';
            expect(getFieldDisplayValue(record, field)).toBeUndefined();
        });

        it('returns field display value for leaf spanning string', () => {
            const field = 'Account.Owner.LastModifiedBy.Name';
            expect(getFieldDisplayValue(record, field)).toBe('Frank Leaf Display Value');
        });

        it('returns field display value for non-leaf spanning string', () => {
            const field = 'Account.Owner.LastModifiedBy';
            expect(getFieldDisplayValue(record, field)).toBe('Frank non-leaf Display Name');
        });

        it('returns undefined for non-existent first field of spanning string', () => {
            const field = 'Account.Nonexistent.Nonexistent';
            expect(getFieldDisplayValue(record, field)).toBeUndefined();
        });

        it('returns undefined for non-existent non-first field of spanning string', () => {
            const field = 'Account.Owner.LastModifiedBy.Nonexistent.Nonexistent';
            expect(getFieldDisplayValue(record, field)).toBeUndefined();
        });
    });
});

describe('isSuperset', () => {
    it('should return true for superset', () => {
        const superset = ['a', 'b', 'c'];
        const subset = ['c', 'a'];
        expect(isSuperset(superset, subset)).toBe(true);
    });

    it('should return true for equivalent', () => {
        const superset = ['a', 'b', 'c'];
        const subset = ['c', 'b', 'a'];
        expect(isSuperset(superset, subset)).toBe(true);
    });

    it('should return false for subset', () => {
        const superset = ['c', 'a'];
        const subset = ['a', 'b', 'c'];
        expect(isSuperset(superset, subset)).toBe(false);
    });
});
