import { Store, Luvio, Environment } from '@luvio/engine';

import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import {
    keyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';
import { ingest } from '../../raml-artifacts/types/RecordRepresentation/ingest';
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
    extractTrackedFieldsToTrie,
    convertTrieToFields,
    convertFieldsToTrie,
    isSuperRecordFieldTrie,
    extractRecordIds,
    RecordFieldTrie,
    TrackedFieldsConfig,
} from '../records';

import record from './data/sampleRecord';
import recursiveRecord from './data/recursiveRecord';
import recursiveRecordDifferentPaths from './data/recursiveRecordDifferentPaths';
import objectInfo from './data/sampleObjectInfo';
import deepRecord from './data/sampleRecordDeep';
import storeRecordsWith6LevelRefsCustom from './data/store-records-6-level-refs-custom.json';
import storeRecordsWith6LevelRefsAccount from './data/store-records-6-level-refs-account.json';
import storeRecordsW8249949 from './data/store-records-w-8249949.json';
import storeRecordsWith6LevelRefsAccountWithoutSiblingIdField from './data/store-records-6-level-refs-account-without-sibling-Id-field.json';

import { ObjectKeys } from '../language';

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
    const trackedFieldsConfig: TrackedFieldsConfig = {
        maxDepth: 5,
        onlyFetchLeafNodeId: false,
    };

    it('should return correct tracked fields', () => {
        const store = new Store();
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        ingest(
            buildSampleRecord(),
            {
                fullPath: keyBuilder({ recordId: record.id }),
                parent: null,
                propertyName: '',
            },
            luvio,
            store,
            0
        );
        const key = keyBuilder({ recordId: record.id });
        const fields = getTrackedFields(key, luvio.getNode(key), trackedFieldsConfig, []);
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
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        ingest(
            buildSampleRecord(),
            {
                fullPath: keyBuilder({ recordId: record.id }),
                parent: null,
                propertyName: '',
            },
            luvio,
            store,
            0
        );
        const key = keyBuilder({ recordId: record.id });
        const fields = getTrackedFields(key, luvio.getNode(key), trackedFieldsConfig, [
            'Account.Foo',
        ]);
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
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        ingest(
            buildSampleRecord(),
            {
                fullPath: keyBuilder({ recordId: record.id }),
                parent: null,
                propertyName: '',
            },
            luvio,
            store,
            0
        );
        const key = keyBuilder({ recordId: record.id });
        const fields = getTrackedFields(key, luvio.getNode(key), trackedFieldsConfig, [
            'Account.Name',
        ]);
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
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        ingest(
            buildRecursiveRecord(),
            {
                fullPath: keyBuilder({ recordId: record.id }),
                parent: null,
                propertyName: '',
            },
            luvio,
            store,
            0
        );

        const key = keyBuilder({ recordId: recursiveRecord.id });
        const fields = getTrackedFields(key, luvio.getNode(key), trackedFieldsConfig, []);
        expect(fields).toEqual(['User.CreatedById', 'User.Email', 'User.Id', 'User.Name']);
    });

    it('should resolve tracked fields on record with circular reference on a per-path basis', () => {
        const store = new Store();
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        ingest(
            buildRecursiveRecordDifferentPaths(),
            {
                fullPath: keyBuilder({ recordId: record.id }),
                parent: null,
                propertyName: '',
            },
            luvio,
            store,
            0
        );

        const key = keyBuilder({ recordId: recursiveRecordDifferentPaths.id });
        const fields = getTrackedFields(key, luvio.getNode(key), trackedFieldsConfig, []);
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
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        ingest(
            record,
            {
                fullPath: keyBuilder({ recordId: record.id }),
                parent: null,
                propertyName: '',
            },
            luvio,
            store,
            0
        );

        const key = keyBuilder({ recordId: record.id });
        const fields = getTrackedFields(key, luvio.getNode(key), trackedFieldsConfig, []);
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

    it('should not include 6 levels deep custom relationship field', () => {
        const store = new Store();
        store.records = storeRecordsWith6LevelRefsCustom;
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        const expectedFields = [
            'Department__c.Id',
            'Department__c.Name',
            'Department__c.ParentDepartment__c',
            'Department__c.ParentDepartment__r.Id',
            'Department__c.ParentDepartment__r.Name',
            'Department__c.ParentDepartment__r.ParentDepartment__c',
            'Department__c.ParentDepartment__r.ParentDepartment__r.Id',
            'Department__c.ParentDepartment__r.ParentDepartment__r.Name',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__c',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Id',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Name',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__c',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Id',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Name',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__c',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Id',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Name',
        ];

        // Record with 6 depth relationship field (boundary value)
        // Name: Dep6, RecordId: a00xx000000bnVlAAI
        const dep6Key = keyBuilder({ recordId: 'a00xx000000bnVlAAI' });
        const dep6Fields = getTrackedFields(
            dep6Key,
            luvio.getNode(dep6Key),
            trackedFieldsConfig,
            []
        );
        expect(dep6Fields).toEqual(expectedFields);

        // Record with 7 depth relationship field
        // Name: Dep7, RecordId: a00xx000000bnXNAAY
        const dep7key = keyBuilder({ recordId: 'a00xx000000bnXNAAY' });
        const dep7Fields = getTrackedFields(
            dep7key,
            luvio.getNode(dep7key),
            trackedFieldsConfig,
            []
        );
        expectedFields.push(
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__c'
        );
        expect(dep7Fields).toEqual(expectedFields);
    });

    it('should not include 6 levels deep null relationship fields which have linked data', () => {
        const store = new Store();
        store.records = storeRecordsW8249949;
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        // Record with 7 depth relationship fields
        // Name: SP-5089528, RecordId: a1nxx000001hGmbAAE
        const dep6Key = keyBuilder({ recordId: 'a1nxx000001hGmbAAE' });
        const dep6Fields = getTrackedFields(
            dep6Key,
            luvio.getNode(dep6Key),
            trackedFieldsConfig,
            []
        );
        const violators = dep6Fields.filter((field) => field.split('.').length > 7); // root + 6
        expect(violators.length).toEqual(0);
    });

    it('should not include 6 levels deep relationship fields have sibling Id field in the store', () => {
        const store = new Store();
        store.records = storeRecordsWith6LevelRefsAccount;
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        const expectedFields = [
            'Account.Parent.Id',
            'Account.Parent.Parent.Id',
            'Account.Parent.Parent.Parent.Id',
            'Account.Parent.Parent.Parent.Parent.Id',
            'Account.Parent.Parent.Parent.Parent.Parent.Id',
            'Account.Parent.Parent.Parent.Parent.ParentId',
            'Account.Parent.Parent.Parent.ParentId',
            'Account.Parent.Parent.ParentId',
            'Account.Parent.ParentId',
            'Account.ParentId',
        ];

        // Record with 6-level depth parent relationship field (boundary value)
        // Top parent record: 001RM00000558MnYAI
        const dep6key = keyBuilder({ recordId: '001RM00000558MhYAI' });
        const dep6Fields = getTrackedFields(
            dep6key,
            luvio.getNode(dep6key),
            trackedFieldsConfig,
            []
        );
        expect(dep6Fields).toEqual(expectedFields);
    });

    /**
     * It's not guaranteed that sibling Id fields (e.g. AccountId) are returned with pre-defined relationship fields.
     * This test case is intended to document the cache state for relationship fields. getTrackedFields() is expectded
     * to return the same result as when relationship fields which havesibling Id field in the store.
     */
    it('should not include 6 levels deep relationship fields which have no sibling Id field in the store', () => {
        const store = new Store();
        store.records = storeRecordsWith6LevelRefsAccountWithoutSiblingIdField;
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        const expectedFields = [
            'Account.Parent.Id',
            'Account.Parent.Parent.Id',
            'Account.Parent.Parent.Parent.Id',
            'Account.Parent.Parent.Parent.Parent.Id',
            'Account.Parent.Parent.Parent.Parent.Parent.Id',
            'Account.Parent.Parent.Parent.Parent.ParentId',
            'Account.Parent.Parent.Parent.ParentId',
            'Account.Parent.Parent.ParentId',
            'Account.Parent.ParentId',
            'Account.ParentId',
        ];

        // Record with 6-level depth parent relationship field (boundary value)
        // Top parent record: 001RM00000558MnYAI
        const dep6Key = keyBuilder({ recordId: '001RM00000558MhYAI' });
        const dep6Fields = getTrackedFields(
            dep6Key,
            luvio.getNode(dep6Key),
            trackedFieldsConfig,
            []
        );
        expect(dep6Fields).toEqual(expectedFields);
    });

    it('should handle root with no child (records with no fields)', () => {
        const key = 'UiApi::RecordTemplateCreateRepresentation:Custom_Object__c:012000000000000AAA';
        const data = {
            apiName: 'Custom_Object__c',
            fields: {},
            recordTypeId: '012000000000000AAA',
        };
        const store = new Store();
        store.records = {
            [key]: data,
        };
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));
        expect(getTrackedFields(key, luvio.getNode(key), trackedFieldsConfig).length).toBe(0);
    });
});

describe('getTrackedFields, with new behavior', () => {
    const trackedFieldsConfig: TrackedFieldsConfig = {
        maxDepth: 1,
        onlyFetchLeafNodeId: true,
    };

    it('should not include fields more than 1 level deep', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));

        ingest(
            record,
            {
                fullPath: keyBuilder({ recordId: record.id }),
                parent: null,
                propertyName: '',
            },
            luvio,
            store,
            0
        );

        const key = keyBuilder({ recordId: record.id });
        const fields = getTrackedFields(key, luvio.getNode(key), trackedFieldsConfig, []);
        expect(fields).toEqual(['TestD__c.TestC__c', 'TestD__c.TestC__r.Id']);
    });
});

describe('extractTrackedFields', () => {
    it('should not include fields more than 6 levels deep', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));
        const recordKey = keyBuilder({ recordId: record.id });
        ingest(record, { fullPath: recordKey, parent: null, propertyName: '' }, luvio, store, 0);

        const node = luvio.getNode<RecordRepresentationNormalized, RecordRepresentation>(recordKey);

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

describe('extractTrackedFieldsToTrie', () => {
    const trackedFieldsConfig: TrackedFieldsConfig = {
        maxDepth: 5,
        onlyFetchLeafNodeId: false,
    };

    it('should not include fields more than 6 levels deep', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const luvio = new Luvio(new Environment(store, () => Promise.reject()));
        const recordKey = keyBuilder({ recordId: record.id });
        ingest(record, { fullPath: recordKey, parent: null, propertyName: '' }, luvio, store, 0);

        const node = luvio.getNode<RecordRepresentationNormalized, RecordRepresentation>(recordKey);

        const root = {
            name: record.apiName,
            children: {},
        };

        extractTrackedFieldsToTrie(recordKey, node, root, trackedFieldsConfig);

        const fields = convertTrieToFields(root);
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

describe('isSuperRecordFieldTrie', () => {
    it('should return true for supertrie', () => {
        const rootA = {
            name: 'a',
            children: {
                b: {
                    name: 'b',
                    children: {},
                },
                c: {
                    name: 'c',
                    children: {},
                },
            },
        };

        const rootB = {
            name: 'a',
            children: {
                c: {
                    name: 'c',
                    children: {},
                },
            },
        };

        expect(isSuperRecordFieldTrie(rootA, rootB)).toBe(true);
    });

    it('should return true for equivalent', () => {
        const rootA = {
            name: 'a',
            children: {
                b: {
                    name: 'b',
                    children: {},
                },
                c: {
                    name: 'c',
                    children: {},
                },
            },
        };

        const rootB = {
            name: 'a',
            children: {
                b: {
                    name: 'b',
                    children: {},
                },
                c: {
                    name: 'c',
                    children: {},
                },
            },
        };

        expect(isSuperRecordFieldTrie(rootA, rootB)).toBe(true);
    });

    it('should return false for subtrie', () => {
        const rootA = {
            name: 'a',
            children: {
                c: {
                    name: 'c',
                    children: {},
                },
            },
        };

        const rootB = {
            name: 'a',
            children: {
                b: {
                    name: 'b',
                    children: {},
                },
                c: {
                    name: 'c',
                    children: {},
                },
            },
        };

        expect(isSuperRecordFieldTrie(rootA, rootB)).toBe(false);
    });
});

describe('extractRecordIds', () => {
    it('extracts ids from simple record', () => {
        const ids = extractRecordIds(buildSampleRecord());
        expect(ObjectKeys(ids)).toEqual([
            'UiApi::RecordRepresentation:001T1000001nFt5IAE',
            'UiApi::RecordRepresentation:005T1000000HkSeIAK',
            'UiApi::RecordRepresentation:005000000000000005',
        ]);
    });
    it('extracts ids deeply nested records', () => {
        const ids = extractRecordIds(buildDeepRecord());
        expect(ObjectKeys(ids)).toEqual([
            'UiApi::RecordRepresentation:a03RM0000004t2LYAQ',
            'UiApi::RecordRepresentation:a02RM00000081S9YAI',
            'UiApi::RecordRepresentation:a00RM0000008EhHYAU',
            'UiApi::RecordRepresentation:006RM000003JZMkYAO',
            'UiApi::RecordRepresentation:001RM000004XMZ5YAO',
            'UiApi::RecordRepresentation:0OHRM0000000D014AE',
            'UiApi::RecordRepresentation:005RM000001stMBYAY',
        ]);
    });
    it('extracts ids and handles rescursive references', () => {
        const ids = extractRecordIds(buildRecursiveRecord());
        expect(ObjectKeys(ids)).toEqual(['UiApi::RecordRepresentation:005xx000001XP3tAAG']);
    });
    it('extracts ids and handles different recursive paths', () => {
        const ids = extractRecordIds(buildRecursiveRecordDifferentPaths());
        expect(ObjectKeys(ids)).toEqual([
            'UiApi::RecordRepresentation:005000000000000005',
            'UiApi::RecordRepresentation:005xx000001XP3tAAG',
        ]);
    });
});

describe('convertFieldsToTrie', () => {
    it('returns an empty trie when empty fields array is sent', () => {
        expect(convertFieldsToTrie([], false)).toEqual({
            name: '',
            children: {},
        });
    });
    it('returns a trie when passed with a set of optional fields', () => {
        expect(convertFieldsToTrie(['MOCK_ENTITY.FIELD1', 'MOCK_ENTITY.FIELD2'], true)).toEqual({
            children: {
                FIELD1: {
                    children: {},
                    name: 'FIELD1',
                    optional: true,
                    scalar: true,
                },
                FIELD2: {
                    children: {},
                    name: 'FIELD2',
                    optional: true,
                    scalar: true,
                },
            },
            name: 'MOCK_ENTITY',
            optional: true,
            scalar: false,
        });
    });
    it('returns a trie when passed with a set of non-optional fields', () => {
        expect(convertFieldsToTrie(['MOCK_ENTITY.FIELD1', 'MOCK_ENTITY.FIELD2'], false)).toEqual({
            children: {
                FIELD1: {
                    children: {},
                    name: 'FIELD1',
                    optional: false,
                    scalar: true,
                },
                FIELD2: {
                    children: {},
                    name: 'FIELD2',
                    optional: false,
                    scalar: true,
                },
            },
            name: 'MOCK_ENTITY',
            optional: false,
            scalar: false,
        });
    });
    it('returns a trie when passed with a set of multi-level fields', () => {
        expect(
            convertFieldsToTrie(['MOCK_ENTITY.FIELD1.FIELD1_1', 'MOCK_ENTITY.FIELD2'], false)
        ).toEqual({
            children: {
                FIELD1: {
                    children: {
                        FIELD1_1: {
                            children: {},
                            name: 'FIELD1_1',
                            optional: false,
                            scalar: true,
                        },
                    },
                    name: 'FIELD1',
                    optional: false,
                    scalar: false,
                },
                FIELD2: {
                    children: {},
                    name: 'FIELD2',
                    optional: false,
                    scalar: true,
                },
            },
            name: 'MOCK_ENTITY',
            optional: false,
            scalar: false,
        });
    });
});

describe('convertTrieToFields', () => {
    it('should return empty array when root node has no child', () => {
        const root: RecordFieldTrie = {
            name: 'ApiName',
            children: {},
        };

        const fields = convertTrieToFields(root);
        expect(fields).toEqual([]);
    });
});
