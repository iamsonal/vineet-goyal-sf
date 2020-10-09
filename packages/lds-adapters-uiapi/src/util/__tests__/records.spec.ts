import { Store, LDS, Environment } from '@ldsjs/engine';

import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import {
    ingest,
    keyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../overrides/types/RecordRepresentation';
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
} from '../records';

import record from './data/sampleRecord';
import recursiveRecord from './data/recursiveRecord';
import recursiveRecordDifferentPaths from './data/recursiveRecordDifferentPaths';
import objectInfo from './data/sampleObjectInfo';
import deepRecord from './data/sampleRecordDeep';
import storeRecordsWith6LevelRefsCustom from './data/store-records-6-level-refs-custom.json';
import storeRecordsWith6LevelRefsAccount from './data/store-records-6-level-refs-account.json';

import { ObjectKeys } from '../language';

const MAX_FIELDS_STRING_LENGTH = 10000;

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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

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

    it('should not include 6 levels deep custom relationship field', () => {
        const store = new Store();
        store.records = storeRecordsWith6LevelRefsCustom;
        const lds = new LDS(new Environment(store, () => Promise.reject()));

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
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__c',
        ];

        // Record with 6 depth relationship field (boundary value)
        // Name: Dep6, RecordId: a00xx000000bnVlAAI
        const dep6Fields = getTrackedFields(lds, 'a00xx000000bnVlAAI', []);
        expect(dep6Fields).toEqual(expectedFields);

        // Record with 7 depth relationship field
        // Name: Dep7, RecordId: a00xx000000bnXNAAY
        const dep7Fields = getTrackedFields(lds, 'a00xx000000bnXNAAY', []);
        expect(dep7Fields).toEqual(expectedFields);
    });

    it('should not include 6 levels deep relationship field', () => {
        const store = new Store();
        store.records = storeRecordsWith6LevelRefsAccount;
        const lds = new LDS(new Environment(store, () => Promise.reject()));

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
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.AccountId',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Id',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Name',
        ];

        // Record with 6 depth relationship field (boundary value)
        // Name: Dep6, RecordId: a00xx000000bnVlAAI
        const dep6Fields = getTrackedFields(lds, 'a00xx000000bnVlAAI', []);
        expect(dep6Fields).toEqual(expectedFields);
    });
});

describe('getTrackedFields with maximum length', () => {
    it('should return correct tracked fields', () => {
        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        ingest(
            buildSampleRecord(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );
        const fields = getTrackedFields(lds, record.id, [], MAX_FIELDS_STRING_LENGTH);
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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        ingest(
            buildSampleRecord(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );
        const fields = getTrackedFields(lds, record.id, ['Account.Foo'], MAX_FIELDS_STRING_LENGTH);
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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        ingest(
            buildSampleRecord(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );
        const fields = getTrackedFields(lds, record.id, ['Account.Name'], MAX_FIELDS_STRING_LENGTH);
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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        ingest(
            buildRecursiveRecord(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );

        const fields = getTrackedFields(lds, recursiveRecord.id, [], MAX_FIELDS_STRING_LENGTH);
        expect(fields).toEqual(['User.CreatedById', 'User.Email', 'User.Id', 'User.Name']);
    });

    it('should resolve tracked fields on record with circular reference on a per-path basis', () => {
        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        ingest(
            buildRecursiveRecordDifferentPaths(),
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );

        const fields = getTrackedFields(
            lds,
            recursiveRecordDifferentPaths.id,
            [],
            MAX_FIELDS_STRING_LENGTH
        );
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
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        ingest(
            record,
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );

        const fields = getTrackedFields(lds, record.id, [], MAX_FIELDS_STRING_LENGTH);
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

    it('should not include fields more than max field string length', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        ingest(
            record,
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );

        const fields = getTrackedFields(lds, record.id, [], 80);
        expect(fields).toEqual([
            'TestD__c.TestC__c',
            'TestD__c.TestC__r.Id',
            'TestD__c.TestC__r.TestA__c',
        ]);
    });

    it('should operate as a first-in-first-out queue', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        ingest(
            record,
            { fullPath: keyBuilder({ recordId: record.id }), parent: null },
            lds,
            store,
            0
        );

        // We want to verify that we're processing spanning records in the order we see them.  In this case, it's verifying this order:
        // 1) TestD__c
        // 2) TestC__r
        // 3) TestA__r
        // 4) Opportunity__r
        //
        // All fields have been visited first before we visit any of their spanning records, and each spanning record being visited is
        // the first one that we encountered on a field set.
        const fields = getTrackedFields(lds, record.id, [], 250);
        expect(fields).toEqual([
            'TestD__c.TestC__c',
            'TestD__c.TestC__r.Id',
            'TestD__c.TestC__r.TestA__c',
            'TestD__c.TestC__r.TestA__r.Id',
            'TestD__c.TestC__r.TestA__r.Opportunity__c',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.AccountId',
            'TestD__c.TestC__r.TestA__r.Opportunity__r.Id',
        ]);
    });

    it('should not include 6 levels deep custom relationship field', () => {
        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));
        store.records = storeRecordsWith6LevelRefsCustom;

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
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__c',
        ];

        // Record with 6 depth relationship field (boundary value)
        // Name: Dep6, RecordId: a00xx000000bnVlAAI
        const dep6Fields = getTrackedFields(
            lds,
            'a00xx000000bnVlAAI',
            [],
            MAX_FIELDS_STRING_LENGTH
        );
        expect(dep6Fields).toEqual(expectedFields);

        // Record with 7 depth relationship field
        // Name: Dep7, RecordId: a00xx000000bnXNAAY
        const dep7Fields = getTrackedFields(
            lds,
            'a00xx000000bnXNAAY',
            [],
            MAX_FIELDS_STRING_LENGTH
        );
        expect(dep7Fields).toEqual(expectedFields);
    });

    it('should not include 6 levels deep relationship field', () => {
        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));
        store.records = storeRecordsWith6LevelRefsAccount;

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
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.AccountId',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Id',
            'Department__c.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.ParentDepartment__r.Name',
        ];

        // Record with 6 depth relationship field (boundary value)
        // Name: Dep6, RecordId: a00xx000000bnVlAAI
        const dep6Fields = getTrackedFields(
            lds,
            'a00xx000000bnVlAAI',
            [],
            MAX_FIELDS_STRING_LENGTH
        );
        expect(dep6Fields).toEqual(expectedFields);
    });
});

describe('extractTrackedFields', () => {
    it('should not include fields more than 6 levels deep', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));
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

describe('extractTrackedFieldsToTrie', () => {
    it('should not include fields more than 6 levels deep', () => {
        const record = buildDeepRecord();

        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));
        const recordKey = keyBuilder({ recordId: record.id });
        ingest(record, { fullPath: recordKey, parent: null }, lds, store, 0);

        const node = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(recordKey);

        const root = {
            name: record.apiName,
            children: {},
        };

        extractTrackedFieldsToTrie(node, root);

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
