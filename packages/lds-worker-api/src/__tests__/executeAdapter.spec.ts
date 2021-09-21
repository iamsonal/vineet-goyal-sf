import timekeeper from 'timekeeper';
import { stripProperties } from '@luvio/adapter-test-library';
import { UpdateRecordConfig } from '@salesforce/lds-adapters-uiapi/dist/types/src/generated/adapters/updateRecord';

import { executeAdapter, executeMutatingAdapter, OnSnapshot } from '../executeAdapter';
import { draftManager } from '../draftQueueImplementation';
import { addMockNetworkResponse } from './mocks/mockNimbusNetwork';

import objectInfo_Account from './mockData/objectInfo-Account.json';
import recordRep_Account from './mockData/RecordRepresentation-Account.json';
import recordRep_Account_Edited from './mockData/RecordRepresentation-Account-Edited.json';
import { objectInfoAccountPath } from './urlPaths';

// W-9173084 - executeAdapter is deprecated. All of these tests have been duplicated
// and moved to subscribeToAdapter.spec.ts and this entire file can be removed
// when executeAdapter is removed.
describe('executeAdapter', () => {
    it('to not throw on expected adapters', () => {
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
        const onSnapshot: OnSnapshot = jest.fn();

        adapterNames.forEach((adapterName) => {
            expect(() =>
                executeAdapter(adapterName, JSON.stringify({}), onSnapshot)
            ).not.toThrowError(`adapter ${adapterName} not recognized`);
        });
    });

    it('throws on missing adapter', () => {
        const onSnapshot: OnSnapshot = jest.fn();

        const missingAdapterName = 'missingAdapter123';

        expect(() =>
            executeAdapter(missingAdapterName, JSON.stringify({}), onSnapshot)
        ).toThrowError(`adapter ${missingAdapterName} not recognized`);
    });

    it('throws when DML adapter called', () => {
        expect(() => executeAdapter('updateRecord', '', jest.fn())).toThrowError(
            'updateRecord is not a GET wire adapter.'
        );
    });

    it('calls getObjectInfo wire adapter', (done) => {
        // setup mock response
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        const onSnapshot: OnSnapshot = (value) => {
            const { data, error } = value;

            expect(data).toEqual(stripProperties(objectInfo_Account, ['eTag']));
            expect(error).toBeUndefined();
            done();
        };

        const unsubscribe = executeAdapter(
            'getObjectInfo',
            JSON.stringify({ objectApiName: 'Account' }),
            onSnapshot
        );

        unsubscribe();
    });

    it('calls error callback on non-2xx response', (done) => {
        // setup mock response
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 400,
            body: JSON.stringify({}),
        });

        const onSnapshot: OnSnapshot = (value) => {
            const { data, error } = value;

            expect(error).toEqual({
                status: 400,
                statusText: 'Bad Request',
                body: {},
                headers: {},
                ok: false,
            });
            expect(data).toBeUndefined();
            done();
        };

        const unsubscribe = executeAdapter(
            'getObjectInfo',
            JSON.stringify({ objectApiName: 'Account' }),
            onSnapshot
        );

        unsubscribe();
    });
});

// W-9173084 - executeMutatingAdapter is deprecated. All of these tests have been duplicated
// and moved to invokeAdapter.spec.ts and this entire file can be removed
// when executeMutatingAdapter is removed.
describe('executeMutatingAdapter', () => {
    let invokeAdapter;

    beforeEach(() => {
        jest.resetModules();
        ({ invokeAdapter } = require('../executeAdapter'));

        expect(draftManager).toBeDefined();
        draftManager.stopQueue();
    });

    it('throws on missing adapter', () => {
        const onSnapshot: OnSnapshot = jest.fn();

        const missingAdapterName = 'missingAdapter123';

        expect(() =>
            executeAdapter(missingAdapterName, JSON.stringify({}), onSnapshot)
        ).toThrowError(`adapter ${missingAdapterName} not recognized`);
    });

    it('fires error callback when trying to edit record after draft delete', async (done) => {
        // setup mock responses
        addMockNetworkResponse(
            'GET',
            `/services/data/v54.0/ui-api/records/${recordRep_Account.id}`,
            {
                headers: {},
                status: 200,
                body: JSON.stringify(recordRep_Account),
            }
        );
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

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
            executeAdapter(
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

        // then populate object info for that record
        await new Promise((resolve) => {
            invokeAdapter('getObjectInfo', JSON.stringify({ objectApiName: 'Account' }), () => {
                resolve(undefined);
            });
        });

        // deleteRecord is a special adapter that does not take in a config object but rather
        // a record ID directly :grimacing:
        const deleteRecordPromise = new Promise((resolve) => {
            executeMutatingAdapter(
                'deleteRecord',
                JSON.stringify(recordRep_Account.id),
                (value) => {
                    const { data, error } = value;

                    // delete response is just an OK response with no body, so data will be undefined
                    expect(data).toBeUndefined();
                    expect(error).toBeUndefined();

                    resolve(undefined);
                }
            );
        });

        await deleteRecordPromise;

        // now try to edit the draft-deleted record, we should get an error callback
        const config: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };
        executeMutatingAdapter('updateRecord', JSON.stringify(config), (value) => {
            const { data, error } = value;

            expect(data).toBeUndefined();
            expect((error as unknown as Error).message).toBe(
                'Cannot enqueue a draft action for a deleted record'
            );
            done();
        });
    });
});
