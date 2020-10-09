import merge from '../merge';
import { buildNetworkSnapshot } from '../../../wire/getRecord/GetRecordFields';
import { LDS, Store, Environment } from '@ldsjs/engine';
import createRecordData from '../../../../src/util/__tests__/data/createSampleData';
import { normalize } from '../../../generated/types/RecordRepresentation';
import { ingest, keyBuilder } from '../../../overrides/types/RecordRepresentation';
jest.mock('../../../wire/getRecord/GetRecordFields', () => {
    return {
        buildNetworkSnapshot: jest.fn(),
    };
});

describe('merge', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Merge integration with Conflict map', () => {
        it('updates conflictMap with existing tracked fields when incoming etag > existing etag', () => {
            const exampleRecordOne = createRecordData(1);
            const exampleRecordTwo = createRecordData(2);
            const existing = JSON.parse(JSON.stringify(exampleRecordOne));
            const incoming = JSON.parse(JSON.stringify(exampleRecordTwo));
            // make a change to the incoming since it's etag is greater
            delete incoming.fields['CreatedDate'];
            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));
            const key = keyBuilder({ recordId: exampleRecordOne.id });
            const path = {
                fullPath: key,
                parent: null,
            };
            ingest(existing, path, lds, store, 0);
            const existingRecord = store.records[key];
            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);
            const conflictMap = {};
            merge(existingRecord, incomingNormalized, lds, path, conflictMap);
            expect(conflictMap[incomingNormalized.id]).toStrictEqual({
                recordId: incomingNormalized.id,
                trackedFields: {
                    children: {
                        CreatedDate: {
                            children: {},
                            name: 'CreatedDate',
                        },
                        Name: {
                            children: {},
                            name: 'Name',
                        },
                        Owner: {
                            children: {
                                City: {
                                    children: {},
                                    name: 'City',
                                },
                                Id: {
                                    children: {},
                                    name: 'Id',
                                },
                                LastModifiedBy: {
                                    children: {
                                        Name: {
                                            children: {},
                                            name: 'Name',
                                        },
                                    },
                                    name: 'LastModifiedBy',
                                },
                            },
                            name: 'Owner',
                        },
                        OwnerId: {
                            children: {},
                            name: 'OwnerId',
                        },
                    },
                    name: 'Account',
                },
            });
        });
        it('updates conflictMap with existing tracked fields when incoming etag < existing etag', () => {
            const exampleRecordOne = createRecordData(1);
            const exampleRecordTwo = createRecordData(2);
            const existing = JSON.parse(JSON.stringify(exampleRecordTwo));
            const incoming = JSON.parse(JSON.stringify(exampleRecordOne));
            // need to make existing not a superset so let's delete existings CreatedDate
            delete existing.fields['CreatedDate'];
            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));
            const key = keyBuilder({ recordId: exampleRecordTwo.id });
            const path = {
                fullPath: key,
                parent: null,
            };
            ingest(existing, path, lds, store, 0);
            const existingRecord = store.records[key];
            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);
            const conflictMap = {};
            merge(existingRecord, incomingNormalized, lds, path, conflictMap);
            expect(conflictMap[incomingNormalized.id]).toStrictEqual({
                recordId: incomingNormalized.id,
                trackedFields: {
                    children: {
                        CreatedDate: {
                            children: {},
                            name: 'CreatedDate',
                        },
                        Name: {
                            children: {},
                            name: 'Name',
                        },
                        Owner: {
                            children: {
                                City: {
                                    children: {},
                                    name: 'City',
                                },
                                Id: {
                                    children: {},
                                    name: 'Id',
                                },
                                LastModifiedBy: {
                                    children: {
                                        Name: {
                                            children: {},
                                            name: 'Name',
                                        },
                                    },
                                    name: 'LastModifiedBy',
                                },
                            },
                            name: 'Owner',
                        },
                        OwnerId: {
                            children: {},
                            name: 'OwnerId',
                        },
                    },
                    name: 'Account',
                },
            });
        });
    });
    describe('incoming etag > existing etag ', () => {
        it('does not make a network request when a conflictMap exists ', () => {
            const spy = buildNetworkSnapshot;
            let incoming = createRecordData(2);
            let existing = createRecordData(1);
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);

            const conflictMap = {};

            merge(existingRecord, incomingNormalized, lds, path, conflictMap);
            expect(spy).not.toHaveBeenCalled();
        });
        it('makes a network request as a fallback ', () => {
            const spy = buildNetworkSnapshot;
            let incoming = createRecordData(2);
            let existing = createRecordData(1);

            // we dont want incoming to be a superset of the fields
            delete incoming.fields['CreatedDate'];
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);

            merge(existingRecord, incomingNormalized, lds, path);
            expect(spy).toHaveBeenCalled();
        });
        it('sets incoming fields that arent on existing fields to undefined (CreateDate should have undefined ref)', () => {
            const expectedMergedFields = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '233f17c01db43cdfe6fe618c6c8cfd51',
                fields: {
                    CreatedDate: {
                        __ref: undefined,
                        pending: true,
                    },
                    Name: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Name',
                    },
                    Owner: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Owner',
                    },
                    OwnerId: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__OwnerId',
                    },
                },
                id: '001T1000001nFt5IAE',
                lastModifiedById: '005T1000000HkSeIAK',
                lastModifiedDate: '2019-08-30T00:38:02.000Z',
                recordTypeId: '012000000000000AAA',
                recordTypeInfo: null,
                systemModstamp: '2019-08-30T00:38:02.000Z',
                weakEtag: 2,
            };

            let incoming = createRecordData(2);
            let existing = createRecordData(1);

            // removing created date from incoming should result in it having an undefined ref in the merged object
            delete incoming.fields['CreatedDate'];
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);
            const conflictMap = {};

            const mergedFields = merge(existingRecord, incomingNormalized, lds, path, conflictMap);

            expect(mergedFields).toEqual(expectedMergedFields);
        });
        it('only shows one instance of a field if it is in both existing and incoming (no duplicates)', () => {
            const expectedMergedFields = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '233f17c01db43cdfe6fe618c6c8cfd51',
                fields: {
                    CreatedDate: {
                        __ref:
                            'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__CreatedDate',
                    },

                    Name: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Name',
                    },
                    Owner: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Owner',
                    },
                    OwnerId: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__OwnerId',
                    },
                },
                id: '001T1000001nFt5IAE',
                lastModifiedById: '005T1000000HkSeIAK',
                lastModifiedDate: '2019-08-30T00:38:02.000Z',
                recordTypeId: '012000000000000AAA',
                recordTypeInfo: null,
                systemModstamp: '2019-08-30T00:38:02.000Z',
                weakEtag: 2,
            };

            let incoming = createRecordData(2);
            let existing = createRecordData(1);
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);
            const conflictMap = {};

            const mergedFields = merge(existingRecord, incomingNormalized, lds, path, conflictMap);

            expect(mergedFields).toEqual(expectedMergedFields);
        });
    });
    describe('incoming etag < existing etag', () => {
        it('does not make a network request when a conflictMap exists ', () => {
            const spy = buildNetworkSnapshot;
            let incoming = createRecordData(1);
            let existing = createRecordData(2);
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);

            const conflictMap = {};

            merge(existingRecord, incomingNormalized, lds, path, conflictMap);
            expect(spy).not.toHaveBeenCalled();
        });
        it('should make a network request as a fallback ', () => {
            const spy = buildNetworkSnapshot;
            let incoming = createRecordData(1);
            let existing = createRecordData(2);
            // we dont want a superset of the higher tag vs the lower tag so I am deleting this tag
            delete existing.fields['CreatedDate'];
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);

            merge(existingRecord, incomingNormalized, lds, path);
            expect(spy).toHaveBeenCalled();
        });
        it('sets incoming fields that arent on existing fields to undefined (CreateDate should have undefined ref)', () => {
            const expectedMergedFields = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '233f17c01db43cdfe6fe618c6c8cfd51',
                fields: {
                    CreatedDate: {
                        __ref: undefined,
                        pending: true,
                    },
                    Name: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Name',
                    },
                    Owner: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Owner',
                    },
                    OwnerId: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__OwnerId',
                    },
                },
                id: '001T1000001nFt5IAE',
                lastModifiedById: '005T1000000HkSeIAK',
                lastModifiedDate: '2019-08-30T00:38:02.000Z',
                recordTypeId: '012000000000000AAA',
                recordTypeInfo: null,
                systemModstamp: '2019-08-30T00:38:02.000Z',
                weakEtag: 2,
            };

            let incoming = createRecordData(1);
            let existing = createRecordData(2);

            // removing created date from the higher tag will result in the object not being a superset
            delete existing.fields['CreatedDate'];
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);
            const conflictMap = {};

            const mergedFields = merge(existingRecord, incomingNormalized, lds, path, conflictMap);

            expect(mergedFields).toEqual(expectedMergedFields);
        });
        it('should only show one instance of a field if it is in both existing and incoming (no duplicates)', () => {
            const expectedMergedFields = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '233f17c01db43cdfe6fe618c6c8cfd51',
                fields: {
                    CreatedDate: {
                        __ref:
                            'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__CreatedDate',
                    },

                    Name: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Name',
                    },
                    OwnerId: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__OwnerId',
                    },
                },
                id: '001T1000001nFt5IAE',
                lastModifiedById: '005T1000000HkSeIAK',
                lastModifiedDate: '2019-08-30T00:38:02.000Z',
                recordTypeId: '012000000000000AAA',
                recordTypeInfo: null,
                systemModstamp: '2019-08-30T00:38:02.000Z',
                weakEtag: 2,
            };

            let incoming = createRecordData(1);
            let existing = createRecordData(2);
            delete incoming.fields['Owner'];
            delete existing.fields['Owner'];
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);
            const conflictMap = {};

            const mergedFields = merge(existingRecord, incomingNormalized, lds, path, conflictMap);

            expect(mergedFields).toEqual(expectedMergedFields);
        });
    });
    describe('incoming etag === existing etag', () => {
        it('should not make a network request when conflict map exists ', () => {
            const spy = buildNetworkSnapshot;
            let incoming = createRecordData(2);
            let existing = createRecordData(2);
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);

            const conflictMap = {};

            merge(existingRecord, incomingNormalized, lds, path, conflictMap);
            expect(spy).not.toHaveBeenCalled();
        });
        it('should merge the two sets of fields if fields are missing on either end', () => {
            const expectedMergedFields = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '233f17c01db43cdfe6fe618c6c8cfd51',
                fields: {
                    CreatedDate: {
                        __ref:
                            'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__CreatedDate',
                    },

                    Name: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Name',
                    },
                    Owner: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Owner',
                    },
                    OwnerId: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__OwnerId',
                    },
                },
                id: '001T1000001nFt5IAE',
                lastModifiedById: '005T1000000HkSeIAK',
                lastModifiedDate: '2019-08-30T00:38:02.000Z',
                recordTypeId: '012000000000000AAA',
                recordTypeInfo: null,
                systemModstamp: '2019-08-30T00:38:02.000Z',
                weakEtag: 2,
            };

            let incoming = createRecordData(2);
            let existing = createRecordData(2);
            // removing both created date from existing and owner from incoming should result in both being in final object
            delete existing.fields['CreatedDate'];
            delete incoming.fields['Owner'];
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);
            const conflictMap = {};

            const mergedFields = merge(existingRecord, incomingNormalized, lds, path, conflictMap);

            expect(mergedFields).toEqual(expectedMergedFields);
        });
        it('should only show one instance of a field if it is in both existing and incoming', () => {
            const expectedMergedFields = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '233f17c01db43cdfe6fe618c6c8cfd51',
                fields: {
                    CreatedDate: {
                        __ref:
                            'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__CreatedDate',
                    },

                    Name: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Name',
                    },
                    Owner: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Owner',
                    },
                    OwnerId: {
                        __ref: 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__OwnerId',
                    },
                },
                id: '001T1000001nFt5IAE',
                lastModifiedById: '005T1000000HkSeIAK',
                lastModifiedDate: '2019-08-30T00:38:02.000Z',
                recordTypeId: '012000000000000AAA',
                recordTypeInfo: null,
                systemModstamp: '2019-08-30T00:38:02.000Z',
                weakEtag: 2,
            };

            let incoming = createRecordData(2);
            let existing = createRecordData(2);
            existing = JSON.parse(JSON.stringify(existing));
            incoming = JSON.parse(JSON.stringify(incoming));

            const store = new Store();
            const lds = new LDS(new Environment(store, jest.fn()));

            const key = keyBuilder({ recordId: existing.id });
            const path = {
                fullPath: key,
                parent: null,
            };

            ingest(existing, path, lds, store, 0);

            const existingRecord = store.records[key];

            const incomingNormalized = normalize(incoming, existingRecord, path, lds, store, 0);
            const conflictMap = {};

            const mergedFields = merge(existingRecord, incomingNormalized, lds, path, conflictMap);

            expect(mergedFields).toEqual(expectedMergedFields);
        });
    });
});
