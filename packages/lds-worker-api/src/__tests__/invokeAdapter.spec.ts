import timekeeper from 'timekeeper';
import { stripProperties } from '@luvio/adapter-test-library';
import { UpdateRecordConfig } from '@salesforce/lds-adapters-uiapi';

import { draftManager } from '../draftQueueImplementation';
import { subscribeToAdapter, invokeAdapter, OnResponse, OnSnapshot } from '../executeAdapter';
import { addMockNetworkResponse } from './mocks/mockNimbusNetwork';

import objectInfo_Account from './mockData/objectInfo-Account.json';
import recordRep_Account from './mockData/RecordRepresentation-Account.json';
import recordRep_Account_Edited from './mockData/RecordRepresentation-Account-Edited.json';
import userId from '../standalone-stubs/salesforce-user-id';

describe('invokeAdapter', () => {
    beforeEach(() => {
        timekeeper.reset();
        expect(draftManager).toBeDefined();
        draftManager.stopQueue();
    });

    it('can invoke GET adapters', () => {
        const adapterNames = [
            'getRecord',
            'getRecords',
            'getRelatedListRecords',
            'getObjectInfo',
            'getListUi',
            'getRecordAvatars',
            'getRecordActions',
            'getLookupRecords',
        ];
        const onResult: OnResponse = jest.fn();

        adapterNames.forEach((adapterName) => {
            expect(() => invokeAdapter(adapterName, JSON.stringify({}), onResult)).not.toThrowError(
                `adapter ${adapterName} not recognized`
            );
        });
    });

    it('throws on missing adapter', () => {
        const onSnapshot: OnSnapshot = jest.fn();

        const missingAdapterName = 'missingAdapter123';

        expect(() =>
            invokeAdapter(missingAdapterName, JSON.stringify({}), onSnapshot)
        ).toThrowError(`adapter ${missingAdapterName} not recognized`);
    });

    it('calls updateRecord adapter, returns draft', async (done) => {
        // setup mock responses
        addMockNetworkResponse(
            'GET',
            `/services/data/v53.0/ui-api/records/${recordRep_Account.id}`,
            {
                headers: {},
                status: 200,
                body: JSON.stringify(recordRep_Account),
            }
        );
        addMockNetworkResponse(
            'PATCH',
            `/services/data/v53.0/ui-api/records/${recordRep_Account_Edited.id}`,
            {
                headers: {},
                status: 200,
                body: JSON.stringify(recordRep_Account_Edited),
            }
        );
        addMockNetworkResponse('GET', '/services/data/v53.0/ui-api/object-info/Account', {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        // ensure DS has object info
        await invokeAdapter(
            'getObjectInfo',
            JSON.stringify({ objectApiName: 'Account' }),
            () => {}
        );

        const testUpdatedDate = new Date();
        timekeeper.freeze(testUpdatedDate);

        const newNameFieldValue = recordRep_Account_Edited.fields.Name.value;
        // for now optimistic responses populate "displayValue" by calling value.toString()
        const optimisticNameField = { value: newNameFieldValue, displayValue: newNameFieldValue };
        const optimisticDraftResponse = {
            ...recordRep_Account_Edited,
            lastModifiedById: userId,
            lastModifiedDate: testUpdatedDate.toISOString(),
            fields: {
                ...recordRep_Account_Edited.fields,
                Name: optimisticNameField,
            },
            drafts: {
                created: false,
                edited: true,
                deleted: false,
                serverValues: {
                    Name: {
                        displayValue: null,
                        value: 'Acme',
                    },
                },
                // draft action IDs are current timestamp plus a double digit index
                draftActionIds: [`${testUpdatedDate.valueOf()}00`],
            },
        };

        let onSnapshotCount = 0;

        // first populate the DS with the record
        const getRecordPromise = new Promise((resolve) => {
            subscribeToAdapter(
                'getRecord',
                JSON.stringify({
                    recordId: recordRep_Account.id,
                    fields: [
                        'Account.CreatedBy.Id',
                        'Account.CreatedBy.Name',
                        'Account.LastModifiedBy.Id',
                        'Account.LastModifiedBy.Name',
                        'Account.Owner.Id',
                        'Account.Owner.Name',
                        'Account.Name',
                    ],
                }),
                (result) => {
                    // this will callback 2 times:
                    // 1st time: initial call to executeAdapter
                    // 2nd time: broadcast from updateRecord's optimistic response
                    // 3rd time: broadcast from the ingest from durable store
                    onSnapshotCount += 1;
                    const { data, error } = result;

                    let expected;
                    if (onSnapshotCount === 1) {
                        expected = stripProperties(recordRep_Account, ['eTag', 'weakEtag']);
                    } else if (onSnapshotCount === 2 || onSnapshotCount === 3) {
                        expected = stripProperties(optimisticDraftResponse, ['eTag', 'weakEtag']);
                    } else {
                        done.fail('unexpected snapshot broadcast');
                    }

                    expect(error).toBeUndefined();
                    expect(data).toEqual(expected);

                    // resolve for the first call since it's being awaited
                    if (onSnapshotCount === 1) {
                        resolve(undefined);
                    }
                }
            );
        });

        await getRecordPromise;

        const onResponse: OnResponse = (value) => {
            const { data, error } = value;
            // currently drafts response doesn't get all fields, just the modified ones
            expect(data).toEqual(
                stripProperties(
                    {
                        ...optimisticDraftResponse,
                        fields: { Name: optimisticNameField },
                    },
                    ['eTag', 'weakEtag']
                )
            );
            expect(error).toBeUndefined();
            done();
        };

        const config: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        invokeAdapter('updateRecord', JSON.stringify(config), onResponse);
    });

    it('fires error callback when trying to edit record after draft delete', async (done) => {
        // setup mock responses
        addMockNetworkResponse(
            'GET',
            `/services/data/v53.0/ui-api/records/${recordRep_Account.id}`,
            {
                headers: {},
                status: 200,
                body: JSON.stringify(recordRep_Account),
            }
        );
        addMockNetworkResponse('GET', '/services/data/v53.0/ui-api/object-info/Account', {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        // ensure DS has object info
        await invokeAdapter(
            'getObjectInfo',
            JSON.stringify({ objectApiName: 'Account' }),
            () => {}
        );

        const testUpdatedDate = new Date();
        timekeeper.freeze(testUpdatedDate);

        const optimisticDraftResponse = {
            ...recordRep_Account,
            drafts: {
                created: false,
                edited: false,
                deleted: true,
                serverValues: {},
                // draft action IDs are current timestamp plus a double digit index
                draftActionIds: [`${testUpdatedDate.valueOf()}00`],
            },
        };

        let onSnapshotCount = 0;

        // first populate the DS with the record
        const getRecordPromise = new Promise((resolve) => {
            subscribeToAdapter(
                'getRecord',
                JSON.stringify({
                    recordId: recordRep_Account.id,
                    fields: [
                        'Account.CreatedBy.Id',
                        'Account.CreatedBy.Name',
                        'Account.LastModifiedBy.Id',
                        'Account.LastModifiedBy.Name',
                        'Account.Owner.Id',
                        'Account.Owner.Name',
                        'Account.Name',
                    ],
                }),
                (result) => {
                    // this will callback 2 times:
                    // 1st time: initial call to executeAdapter
                    // 2nd time: broadcast from deleteRecord's optimistic response
                    onSnapshotCount += 1;

                    let expected;
                    if (onSnapshotCount === 1) {
                        expected = stripProperties(recordRep_Account, ['eTag', 'weakEtag']);
                    } else if (onSnapshotCount === 2) {
                        expected = stripProperties(optimisticDraftResponse, ['eTag', 'weakEtag']);
                    } else {
                        done.fail('onSnapshot called back unexpected number of times');
                    }

                    const { data, error } = result;
                    expect(error).toBeUndefined();
                    expect(data).toEqual(expected);

                    // resolve for the first call since it's being awaited
                    if (onSnapshotCount === 1) {
                        resolve(undefined);
                    }
                }
            );
        });

        await getRecordPromise;

        // deleteRecord is a special adapter that does not take in a config object but rather
        // a record ID directly :grimacing:
        const deleteRecordPromise = new Promise((resolve) => {
            invokeAdapter('deleteRecord', JSON.stringify(recordRep_Account.id), (value) => {
                const { data, error } = value;

                // delete response is just an OK response with no body, so data will be undefined
                expect(data).toBeUndefined();
                expect(error).toBeUndefined();

                resolve(undefined);
            });
        });

        await deleteRecordPromise;

        // now try to edit the draft-deleted record, we should get an error callback
        const config: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };
        invokeAdapter('updateRecord', JSON.stringify(config), (value) => {
            const { data, error } = value;

            expect(data).toBeUndefined();
            expect((error as unknown as Error).message).toBe(
                'Cannot enqueue a draft action for a deleted record'
            );
            done();
        });
    });

    it('only calls response for get adapters once', async (done) => {
        // setup mock responses
        addMockNetworkResponse(
            'GET',
            `/services/data/v53.0/ui-api/records/${recordRep_Account.id}`,
            {
                headers: {},
                status: 200,
                body: JSON.stringify(recordRep_Account),
            }
        );
        addMockNetworkResponse(
            'PATCH',
            `/services/data/v53.0/ui-api/records/${recordRep_Account_Edited.id}`,
            {
                headers: {},
                status: 200,
                body: JSON.stringify(recordRep_Account_Edited),
            }
        );
        addMockNetworkResponse('GET', '/services/data/v53.0/ui-api/object-info/Account', {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        // ensure DS has object info
        await invokeAdapter(
            'getObjectInfo',
            JSON.stringify({ objectApiName: 'Account' }),
            () => {}
        );

        const getConfig = {
            recordId: recordRep_Account.id,
            fields: ['Account.Name'],
        };
        let onGetResultCount = 0;
        let subscribeResolve: any | undefined;
        let subscribePromise = new Promise(function (resolve) {
            subscribeResolve = resolve;
        });
        const onGetResult: OnResponse = (value) => {
            onGetResultCount += 1;
            expect(value.data).toBeDefined();
            expect(value.error).toBeUndefined();
            if (subscribeResolve !== undefined) {
                subscribeResolve();
                subscribeResolve = undefined;
            }
        };

        const testUpdatedDate = new Date();
        timekeeper.freeze(testUpdatedDate);

        invokeAdapter('getRecord', JSON.stringify(getConfig), onGetResult);
        await subscribePromise;

        const newNameFieldValue = recordRep_Account_Edited.fields.Name.value;
        // for now optimistic responses populate "displayValue" by calling value.toString()
        const optimisticNameField = { value: newNameFieldValue, displayValue: newNameFieldValue };
        const optimisticDraftResponse = {
            ...recordRep_Account_Edited,
            lastModifiedById: userId,
            lastModifiedDate: testUpdatedDate.toISOString(),
            fields: {
                ...recordRep_Account_Edited.fields,
                Name: optimisticNameField,
            },
            drafts: {
                created: false,
                edited: true,
                deleted: false,
                serverValues: {
                    Name: {
                        displayValue: null,
                        value: 'Acme',
                    },
                },
                // draft action IDs are current timestamp plus a double digit index
                draftActionIds: [`${testUpdatedDate.valueOf()}00`],
            },
        };

        let onResponseCount = 0;
        const onResponse: OnResponse = (value) => {
            onResponseCount += 1;
            const { data, error } = value;

            // currently drafts response doesn't get all fields, just the modified ones
            expect(data).toEqual(
                stripProperties(
                    {
                        ...optimisticDraftResponse,
                        fields: { Name: optimisticNameField },
                    },
                    ['eTag', 'weakEtag']
                )
            );
            expect(error).toBeUndefined();
            expect(onGetResultCount).toEqual(1);
            expect(onResponseCount).toEqual(1);
            done();
        };

        const config: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        expect(onGetResultCount).toEqual(1);
        expect(onResponseCount).toEqual(0);
        invokeAdapter('updateRecord', JSON.stringify(config), onResponse);
    });
});
