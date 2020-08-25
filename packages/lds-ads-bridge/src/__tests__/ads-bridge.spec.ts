import { LDS, Store, Environment } from '@ldsjs/engine';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { ingestRecord } from '@salesforce/lds-adapters-uiapi';

import AdsBridge from '../ads-bridge';
import { addObjectInfo, addRecord, createObjectInfo, createRecord } from './test-utils';

function createBridge() {
    const store = new Store();
    const environment = new Environment(store, () => Promise.resolve());
    const lds = new LDS(environment);
    const bridge = new AdsBridge(lds);

    return { store, lds, bridge };
}

jest.mock('@salesforce/lds-instrumentation', () => {
    return {
        timerMetricAddDuration: jest.fn(),
    };
});

import { timerMetricAddDuration as timerMetricAddDurationSpy } from '@salesforce/lds-instrumentation';

// constants for record type tests
const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

const nonMasterRecordTypeInfo = {
    available: true,
    defaultRecordTypeMapping: true,
    master: false,
    name: 'non-master-record-type',
    description: 'foo',
    recordTypeId: 'non-master',
};

function queryRecord(lds: LDS, { recordId }: { recordId: string }): any {
    return lds.storeLookup({
        recordId: keyBuilderRecord({ recordId }),
        node: {
            kind: 'Fragment',
            private: [],
        },
        variables: {},
    });
}

beforeEach(() => {
    timerMetricAddDurationSpy.mockClear();
});

describe('AdsBridge', () => {
    describe('addRecords', () => {
        it('ingests all the records if no allowlist is provided', () => {
            const { lds, bridge } = createBridge();

            bridge.addRecords([
                createRecord({
                    id: '123',
                    apiName: 'Public',
                }),
                createRecord({
                    id: '456',
                    apiName: 'Secret',
                }),
            ]);

            const { data: publicRecord } = queryRecord(lds, { recordId: '123' });
            expect(publicRecord.id).toBe('123');
            const { data: secretRecord } = queryRecord(lds, { recordId: '456' });
            expect(secretRecord.id).toBe('456');
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('ingests the records unless they are explicitly not allowlisted', () => {
            const { lds, bridge } = createBridge();

            bridge.addRecords(
                [
                    createRecord({
                        id: '123',
                        apiName: 'Public',
                    }),
                    createRecord({
                        id: '456',
                        apiName: 'Secret',
                    }),
                ],
                {
                    Secret: 'false',
                }
            );

            const { data: publicRecord } = queryRecord(lds, { recordId: '123' });
            expect(publicRecord.id).toBe('123');
            const { data: secretRecord } = queryRecord(lds, { recordId: '456' });
            expect(secretRecord).toBe(undefined);
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it("doesn't emit ingested records via the bridge", () => {
            const { bridge } = createBridge();

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            bridge.addRecords([
                createRecord({
                    id: '123',
                    apiName: 'Public',
                }),
                createRecord({
                    id: '456',
                    apiName: 'Secret',
                }),
            ]);

            expect(fn).toHaveBeenCalledTimes(0);
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('keeps the original record intact', () => {
            const { bridge } = createBridge();

            const config = {
                id: '123',
                apiName: 'Public',
                fields: {
                    Id: {
                        value: '123',
                        displayValue: null,
                    },
                },
            };
            const record = createRecord(config);
            const recordCopy = JSON.parse(JSON.stringify(record));

            bridge.addRecords([record]);

            expect(record).toEqual(recordCopy);
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('does not let master record type overwrite non-master record type', () => {
            const { bridge, lds } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123',
                    recordTypeId: nonMasterRecordTypeInfo.recordTypeId,
                    recordTypeInfo: nonMasterRecordTypeInfo,
                })
            );

            bridge.addRecords([
                createRecord({
                    id: '123',
                    recordTypeId: MASTER_RECORD_TYPE_ID,
                    recordTypeInfo: null,
                }),
            ]);

            expect(queryRecord(lds, { recordId: '123' })).toMatchObject({
                data: {
                    recordTypeId: nonMasterRecordTypeInfo.recordTypeId,
                    recordTypeInfo: nonMasterRecordTypeInfo,
                },
            });
        });

        it('lets non-master record type overwrie master record type', () => {
            const { bridge, lds } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123',
                    recordTypeId: MASTER_RECORD_TYPE_ID,
                    recordTypeInfo: null,
                })
            );

            bridge.addRecords([
                createRecord({
                    id: '123',
                    recordTypeId: nonMasterRecordTypeInfo.recordTypeId,
                    recordTypeInfo: nonMasterRecordTypeInfo,
                }),
            ]);

            expect(queryRecord(lds, { recordId: '123' })).toMatchObject({
                data: {
                    recordTypeId: nonMasterRecordTypeInfo.recordTypeId,
                    recordTypeInfo: nonMasterRecordTypeInfo,
                },
            });
        });

        it('recurses over nested records when checking record types', () => {
            const { bridge, lds } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123',
                    recordTypeId: MASTER_RECORD_TYPE_ID,
                    recordTypeInfo: null,
                    fields: {
                        Child: {
                            displayValue: null,
                            value: createRecord({
                                id: '456',
                                recordTypeId: MASTER_RECORD_TYPE_ID,
                                recordTypeInfo: null,
                            }),
                        },
                    },
                })
            );

            bridge.addRecords([
                // same as above, except child now has non-master record type
                createRecord({
                    id: '123',
                    recordTypeId: MASTER_RECORD_TYPE_ID,
                    recordTypeInfo: null,
                    fields: {
                        Child: {
                            displayValue: null,
                            value: createRecord({
                                id: '456',
                                recordTypeId: nonMasterRecordTypeInfo.recordTypeId,
                                recordTypeInfo: nonMasterRecordTypeInfo,
                            }),
                        },
                    },
                }),
            ]);

            expect(queryRecord(lds, { recordId: '123' })).toMatchObject({
                data: {
                    recordTypeId: MASTER_RECORD_TYPE_ID,
                    recordTypeInfo: null,
                    fields: {
                        Child: {
                            value: {
                                recordTypeId: nonMasterRecordTypeInfo.recordTypeId,
                                recordTypeInfo: nonMasterRecordTypeInfo,
                            },
                        },
                    },
                },
            });
        });
    });

    describe('evict', () => {
        it('should remove an existing record if there is one', async () => {
            const { bridge, lds } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123',
                })
            );

            expect(queryRecord(lds, { recordId: '123' })).toMatchObject({ state: 'Fulfilled' });
            await bridge.evict('123');
            expect(queryRecord(lds, { recordId: '123' })).toMatchObject({ state: 'Unfulfilled' });
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('should not emit when a record has been deleted via the bridge', async () => {
            const { bridge, lds } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123',
                })
            );

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            await bridge.evict('123');

            expect(fn).not.toHaveBeenCalled();
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('getTrackedFieldsForRecord', () => {
        it('returns the fields associated with a record', async () => {
            const { bridge } = createBridge();

            bridge.addRecords([
                createRecord({
                    id: '123',
                    apiName: 'Test__c',
                    fields: {
                        Id: { displayValue: null, value: '123' },
                        Name: { displayValue: null, value: 'Test' },
                        Amount: { displayValue: null, value: 123 },
                    },
                }),
            ]);

            const fields = await bridge.getTrackedFieldsForRecord('123');
            expect(fields).toEqual(['Test__c.Id', 'Test__c.Name', 'Test__c.Amount']);
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it("doesn't return the spanning records fields", async () => {
            const { bridge } = createBridge();

            bridge.addRecords([
                createRecord({
                    id: '123',
                    apiName: 'Test__c',
                    fields: {
                        Id: { displayValue: null, value: '123' },
                        Child: {
                            displayValue: null,
                            value: createRecord({
                                id: '456',
                                apiName: 'Child__c',
                                fields: {
                                    Id: { displayValue: null, value: '456' },
                                    Name: { displayValue: null, value: 'Child' },
                                },
                            }),
                        },
                    },
                }),
            ]);

            const fields = await bridge.getTrackedFieldsForRecord('123');
            expect(fields).toEqual(['Test__c.Id', 'Test__c.Child']);
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('receiveFromLdsCallback', () => {
        it('emits when a record is ingested', () => {
            const { bridge, lds } = createBridge();

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'Test__c',
                    fields: {
                        Id: { displayValue: null, value: '123456' },
                    },
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(
                {
                    '123456': {
                        Test__c: {
                            isPrimary: true,
                            record: expect.objectContaining({
                                id: '123456',
                                apiName: 'Test__c',
                                fields: {
                                    Id: { displayValue: null, value: '123456' },
                                },
                            }),
                        },
                    },
                },
                expect.any(Object)
            );
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('does not emit when a record is evicted from lds', () => {
            const { bridge, lds } = createBridge();

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;
            const mockRecordId = '123456';
            addRecord(
                lds,
                createRecord({
                    id: mockRecordId,
                    apiName: 'Test__c',
                    fields: {
                        Id: { displayValue: null, value: '123456' },
                    },
                })
            );

            lds.storeEvict(keyBuilderRecord({ recordId: mockRecordId }));
            lds.storeBroadcast();

            // verify mocked callback only called once for addRecord
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('does not emit when a record is ingested then evicted prior to broadcast', () => {
            const { bridge, lds } = createBridge();

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;
            const mockRecordId = '123456';
            const mockRecord = createRecord({
                id: mockRecordId,
                apiName: 'Test__c',
                fields: {
                    Id: { displayValue: null, value: '123456' },
                },
            });

            lds.storeIngest('', ingestRecord, mockRecord);
            lds.storeEvict(keyBuilderRecord({ recordId: mockRecordId }));
            lds.storeBroadcast();

            expect(fn).toHaveBeenCalledTimes(0);
        });

        it('emits a new field ingested into an existed record', () => {
            const { bridge, lds } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'Test__c',
                    fields: {
                        Id: { displayValue: null, value: '123456' },
                    },
                })
            );

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'Test__c',
                    fields: {
                        Name: { displayValue: null, value: 'Test' },
                    },
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(
                {
                    '123456': {
                        Test__c: {
                            isPrimary: true,
                            record: expect.objectContaining({
                                id: '123456',
                                apiName: 'Test__c',
                                fields: {
                                    Id: { displayValue: null, value: '123456' },
                                    Name: { displayValue: null, value: 'Test' },
                                },
                            }),
                        },
                    },
                },
                expect.any(Object)
            );
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('emits all the ingested records', () => {
            const { bridge, lds } = createBridge();

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123',
                    fields: {
                        Id: { displayValue: null, value: '123' },
                        CreatedBy: {
                            displayValue: null,
                            value: createRecord({
                                id: '456',
                                fields: {
                                    Id: { displayValue: null, value: '456' },
                                },
                            }),
                        },
                    },
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(
                {
                    '123': {
                        Test__c: {
                            isPrimary: true,
                            record: expect.objectContaining({
                                id: '123',
                                apiName: 'Test__c',
                                fields: {
                                    Id: { displayValue: null, value: '123' },
                                    CreatedBy: {
                                        displayValue: null,
                                        value: expect.objectContaining({
                                            id: '456',
                                            apiName: 'Test__c',
                                            fields: {},
                                        }),
                                    },
                                },
                            }),
                        },
                    },
                    '456': {
                        Test__c: {
                            isPrimary: true,
                            record: expect.objectContaining({
                                id: '456',
                                apiName: 'Test__c',
                                fields: {
                                    Id: { displayValue: null, value: '456' },
                                },
                            }),
                        },
                    },
                },
                expect.any(Object)
            );
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('emits records with circular dependencies stripped out', () => {
            const { bridge, lds } = createBridge();

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    fields: {
                        CreatedBy: {
                            displayValue: null,
                            value: createRecord({
                                id: '123456',
                                fields: {
                                    Id: { displayValue: null, value: '123456' },
                                },
                            }),
                        },
                    },
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(
                {
                    '123456': {
                        Test__c: {
                            isPrimary: true,
                            record: expect.objectContaining({
                                id: '123456',
                                apiName: 'Test__c',
                                fields: {
                                    Id: { displayValue: null, value: '123456' },
                                    CreatedBy: {
                                        displayValue: null,
                                        value: expect.objectContaining({
                                            id: '123456',
                                            apiName: 'Test__c',
                                            fields: {},
                                        }),
                                    },
                                },
                            }),
                        },
                    },
                },
                expect.any(Object)
            );
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('emits stripped down spanning records when spanning record value is not present', () => {
            const { bridge, lds } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'Opportunity',
                    fields: {
                        Account: {
                            displayValue: null,
                            value: createRecord({
                                id: '789',
                                apiName: 'Account',
                                fields: {
                                    Id: { displayValue: null, value: '789' },
                                },
                            }),
                        },
                    },
                })
            );

            lds.storeEvict(keyBuilderRecord({ recordId: '789' }));
            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'Opportunity',
                    fields: {
                        Id: { displayValue: null, value: '123456' },
                    },
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(
                {
                    '123456': {
                        Opportunity: {
                            isPrimary: true,
                            record: expect.objectContaining({
                                id: '123456',
                                apiName: 'Opportunity',
                                fields: {
                                    Id: { displayValue: null, value: '123456' },
                                },
                            }),
                        },
                    },
                },
                expect.any(Object)
            );
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('does not emit data when spanning record value is pending', () => {
            const { bridge, lds, store } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123',
                    apiName: 'Opportunity',
                    fields: {
                        Account: {
                            displayValue: null,
                            value: createRecord({
                                id: '456',
                                apiName: 'Account',
                                fields: {},
                            }),
                        },
                    },
                })
            );

            // Mark the ingested record in the store as pending.
            const accountLinkNode = lds
                .getNode(keyBuilderRecord({ recordId: '123' }))
                .object('fields')
                .link('Account');
            store.records[accountLinkNode.data.__ref] = {
                displayValue: null,
                value: {
                    __ref: undefined,
                    pending: true,
                },
            };

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            // Trigger the bridge emit flow once on the record with the pending field by adding a
            // new field to the same record.
            addRecord(
                lds,
                createRecord({
                    id: '123',
                    apiName: 'Opportunity',
                    fields: {
                        Id: { displayValue: null, value: '123' },
                    },
                })
            );

            expect(fn).not.toHaveBeenCalled();
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('does not emit data when record has a pending field', () => {
            const { bridge, lds, store } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123',
                    apiName: 'Opportunity',
                    fields: {
                        Id: {
                            displayValue: null,
                            value: '123',
                        },
                    },
                })
            );

            // Mark the Id field of the ingested record in the store as pending.
            const recordKey = keyBuilderRecord({ recordId: '123' });
            store.records[recordKey].fields.Id = {
                __ref: undefined,
                pending: true,
            };

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            // add a new record to trigger the bridge emit flow
            addRecord(
                lds,
                createRecord({
                    id: '123',
                    apiName: 'Opportunity',
                    fields: {
                        Name: { displayValue: null, value: 'abc' },
                    },
                })
            );

            expect(fn).not.toHaveBeenCalled();
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('emits stripped down spanning records when spanning record value is isMissing', () => {
            const { bridge, lds, store } = createBridge();

            addRecord(
                lds,
                createRecord({
                    id: '123',
                    apiName: 'Opportunity',
                    fields: {
                        Account: {
                            displayValue: null,
                            value: createRecord({
                                id: '456',
                                apiName: 'Account',
                                fields: {},
                            }),
                        },
                    },
                })
            );

            // Mark the ingested record in the store as missing.
            const accountLinkNode = lds
                .getNode(keyBuilderRecord({ recordId: '123' }))
                .object('fields')
                .link('Account');
            store.records[accountLinkNode.data.__ref] = {
                displayValue: null,
                value: {
                    __ref: undefined,
                    isMissing: true,
                },
            };

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            // Trigger the bridge emit flow once on the record with the missing field by adding a
            // new field to the same record.
            addRecord(
                lds,
                createRecord({
                    id: '123',
                    apiName: 'Opportunity',
                    fields: {
                        Id: { displayValue: null, value: '123' },
                    },
                })
            );

            expect(fn).toHaveBeenCalledWith(
                {
                    '123': {
                        Opportunity: {
                            isPrimary: true,
                            record: expect.objectContaining({
                                id: '123',
                                apiName: 'Opportunity',
                                fields: {
                                    Id: { displayValue: null, value: '123' },
                                },
                            }),
                        },
                    },
                },
                expect.any(Object)
            );
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('extracts the object metadata from the record if the object info is missing', () => {
            const { bridge, lds } = createBridge();

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'Test__c',
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(expect.any(Object), {
                Test__c: {
                    _entityLabel: 'Test__c',
                    _keyPrefix: '123',
                    _nameField: 'Name',
                },
            });
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('passes null keyPrefix from the record if the object info keyPrefix is null', () => {
            const { bridge, lds } = createBridge();

            addObjectInfo(
                lds,
                createObjectInfo({
                    apiName: 'User',
                    associateEntityType: null,
                    associateParentEntity: null,
                    keyPrefix: null,
                    label: 'User',
                    nameFields: ['Name'],
                })
            );

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'User',
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(expect.any(Object), {
                User: {
                    _entityLabel: 'User',
                    _keyPrefix: null,
                    _nameField: 'Name',
                },
            });
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('extracts the object metadata from the object info if present', () => {
            const { bridge, lds } = createBridge();

            addObjectInfo(
                lds,
                createObjectInfo({
                    apiName: 'Test__c',
                    associateEntityType: null,
                    associateParentEntity: null,
                    keyPrefix: 'TEST',
                    label: 'Test',
                    nameFields: ['Name'],
                })
            );

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'Test__c',
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(expect.any(Object), {
                Test__c: {
                    _entityLabel: 'Test',
                    _keyPrefix: 'TEST',
                    _nameField: 'Name',
                },
            });
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('extracts the first field name if multiple are provided', () => {
            const { bridge, lds } = createBridge();

            addObjectInfo(
                lds,
                createObjectInfo({
                    apiName: 'Test__c',
                    associateEntityType: null,
                    associateParentEntity: null,
                    keyPrefix: 'TEST',
                    label: 'Test',
                    nameFields: ['First_Name', 'Last_Name'],
                })
            );

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;

            addRecord(
                lds,
                createRecord({
                    id: '123456',
                    apiName: 'Test__c',
                })
            );

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(expect.any(Object), {
                Test__c: {
                    _entityLabel: 'Test',
                    _keyPrefix: 'TEST',
                    _nameField: 'First_Name',
                },
            });
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(1);
        });

        it('stops emitting if the function is replaced with undefined', () => {
            const { bridge, lds } = createBridge();

            const fn = jest.fn();
            bridge.receiveFromLdsCallback = fn;
            bridge.receiveFromLdsCallback = undefined;

            addRecord(
                lds,
                createRecord({
                    id: '123',
                    apiName: 'Test__c',
                    fields: {
                        Id: { displayValue: null, value: '123' },
                    },
                })
            );

            expect(fn).not.toHaveBeenCalled();
            expect(timerMetricAddDurationSpy).toHaveBeenCalledTimes(0);
        });
    });
});
