import timekeeper from 'timekeeper';
import { addMockNetworkResponse, resetMockNetworkAdapter } from './mocks/mockNimbusNetwork';
import { OnResponse } from '../executeAdapter';
import objectInfo_Account from './mockData/objectInfo-Account.json';
import recordRep_Account from './mockData/RecordRepresentation-Account.json';
import recordRep_Account_Edited from './mockData/RecordRepresentation-Account-Edited.json';
import { UpdateRecordConfig } from '@salesforce/lds-adapters-uiapi';
import { recordEndpointPath, objectInfoAccountPath } from './urlPaths';
import { flushPromises } from './utils';

describe('invokeAdapterWithDraftToReplace', () => {
    let invokeAdapter,
        subscribeToAdapter,
        invokeAdapterWithDraftToReplace,
        draftManager,
        invokeAdapterWithMetadata;

    beforeEach(async () => {
        await flushPromises();
        jest.resetModules();
        ({
            invokeAdapter,
            subscribeToAdapter,
            invokeAdapterWithDraftToReplace,
            invokeAdapterWithMetadata,
        } = require('../executeAdapter'));
        ({ draftManager } = require('../draftQueueImplementation'));
        resetMockNetworkAdapter();
        timekeeper.reset();
        expect(draftManager).toBeDefined();
        draftManager.stopQueue();
        await new Promise((resolve) => {
            let allPromises = [];
            draftManager.getQueue().then((drafts) => {
                const draftsLen = drafts.items.length;
                for (let i = 0; i < draftsLen; i++) {
                    const draft = drafts.items[i];
                    allPromises.push(draftManager.removeDraftAction(draft.id));
                }
                Promise.all(allPromises).then(() => {
                    resolve(undefined);
                });
            });
        });
        const drafts = await draftManager.getQueue();
        expect(drafts.items.length).toBe(0);
    });

    it('replaces the specified draft with the new one', async (done) => {
        // setup mock responses
        addMockNetworkResponse('GET', recordEndpointPath(recordRep_Account.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account),
        });
        addMockNetworkResponse('PATCH', recordEndpointPath(recordRep_Account_Edited.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account_Edited),
        });
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        // ensure DS has object info
        await new Promise((resolve) => {
            invokeAdapter('getObjectInfo', JSON.stringify({ objectApiName: 'Account' }), () => {
                resolve(undefined);
            });
        });

        await flushPromises();

        const config: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        const metadata = { expected: 'metadata' };

        //get a draft into the queue
        await new Promise((resolve) => {
            invokeAdapterWithMetadata(
                'updateRecord',
                JSON.stringify(config),
                metadata,
                (responseValue) => {
                    const { data, error } = responseValue;
                    expect(data).toBeDefined();
                    expect(error).toBeUndefined();
                    resolve(undefined);
                }
            );
        });
        let drafts = await draftManager.getQueue();
        expect(drafts.items.length).toBe(1);
        const draftToReplace = drafts.items[0];
        expect(draftToReplace.metadata.expected).toEqual('metadata');

        const secondConfig: UpdateRecordConfig = {
            fields: { Name: 'Something Different' },
            recordId: recordRep_Account.id,
        };

        // call the replace action invokeAdapter overload
        await new Promise((resolve) => {
            invokeAdapterWithDraftToReplace(
                'updateRecord',
                JSON.stringify(secondConfig),
                draftToReplace.id,
                (responseValue) => {
                    const { data, error } = responseValue;
                    expect(data).toBeDefined();
                    expect(error).toBeUndefined();
                    resolve(undefined);
                }
            );
        });

        drafts = await draftManager.getQueue();
        expect(drafts.items.length).toBe(1);
        const replacedDraft = drafts.items[0];
        expect(replacedDraft.id).toBe(draftToReplace.id);
        expect(replacedDraft.metadata.expected).toEqual('metadata');

        let nameValue = '';
        await new Promise((resolve) => {
            invokeAdapter(
                'getRecord',
                JSON.stringify({
                    recordId: recordRep_Account.id,
                    fields: ['Account.Name'],
                }),
                (result) => {
                    nameValue = result.data.fields.Name.value;
                    resolve(undefined);
                }
            );
        });
        expect(nameValue).toBe('Something Different');
        done();
    });

    it('replaces the draft with the new one when calling deleteRecord', async () => {
        // setup mock responses
        addMockNetworkResponse('GET', recordEndpointPath(recordRep_Account.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account),
        });
        addMockNetworkResponse('PATCH', recordEndpointPath(recordRep_Account_Edited.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account_Edited),
        });
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        // ensure DS has object info
        await new Promise((resolve) => {
            invokeAdapter('getObjectInfo', JSON.stringify({ objectApiName: 'Account' }), () => {
                resolve(undefined);
            });
        });

        await flushPromises();

        const config: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        const metadata = { expected: 'metadata' };

        //get a draft into the queue
        await new Promise((resolve) => {
            invokeAdapterWithMetadata(
                'updateRecord',
                JSON.stringify(config),
                metadata,
                (responseValue) => {
                    const { data, error } = responseValue;
                    expect(data).toBeDefined();
                    expect(error).toBeUndefined();
                    resolve(undefined);
                }
            );
        });
        let drafts = await draftManager.getQueue();
        expect(drafts.items.length).toBe(1);
        const draftToReplace = drafts.items[0];
        expect(draftToReplace.metadata.expected).toEqual('metadata');

        // call the replace action invokeAdapter overload
        await new Promise((resolve) => {
            invokeAdapterWithDraftToReplace(
                'deleteRecord',
                JSON.stringify(recordRep_Account.id),
                draftToReplace.id,
                (responseValue) => {
                    const { data, error } = responseValue;
                    expect(data).toBeUndefined();
                    expect(error).toBeUndefined();
                    resolve(undefined);
                }
            );
        });

        drafts = await draftManager.getQueue();
        expect(drafts.items.length).toBe(1);
        const replacedDraft = drafts.items[0];
        expect(replacedDraft.id).toBe(draftToReplace.id);
        expect(replacedDraft.metadata.expected).toEqual('metadata');
    });

    it('errors when calling with an adapter that is not mutating', async (done) => {
        // setup mock responses
        addMockNetworkResponse('GET', recordEndpointPath(recordRep_Account.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account),
        });
        addMockNetworkResponse('PATCH', recordEndpointPath(recordRep_Account_Edited.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account_Edited),
        });
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        // ensure DS has object info
        await new Promise((resolve) => {
            invokeAdapter('getObjectInfo', JSON.stringify({ objectApiName: 'Account' }), () => {
                resolve(undefined);
            });
        });

        await flushPromises();

        const config: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        //get a draft into the queue
        await new Promise((resolve) => {
            invokeAdapter('updateRecord', JSON.stringify(config), (responseValue) => {
                const { data, error } = responseValue;
                expect(data).toBeDefined();
                expect(error).toBeUndefined();
                resolve(undefined);
            });
        });
        let drafts = await draftManager.getQueue();
        expect(drafts.items.length).toBe(1);
        const createdDraft = drafts.items[0];

        const onResponse: OnResponse = (value) => {
            const { data, error } = value;
            expect(data).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.statusText).toEqual('Bad Request');
            const anyBody = error.body as any;
            expect(anyBody.message).toEqual('adapterId must be a mutating adapter');
            done();
        };
        invokeAdapterWithDraftToReplace('getRecord', '', createdDraft.id, onResponse);
    });

    it('sends a custom error when the mutating adapter did not create a draft', async () => {
        // setup mock responses
        addMockNetworkResponse('GET', recordEndpointPath(recordRep_Account.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account),
        });
        addMockNetworkResponse('PATCH', recordEndpointPath(recordRep_Account_Edited.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account_Edited),
        });
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        // ensure DS has object info
        await new Promise((resolve) => {
            invokeAdapter('getObjectInfo', JSON.stringify({ objectApiName: 'Account' }), () => {
                resolve(undefined);
            });
        });

        await flushPromises();

        const testUpdatedDate = new Date();
        timekeeper.freeze(testUpdatedDate);

        let onSnapshotCount = 0;

        const goodConfig: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        //get a draft into the queue
        await new Promise((resolve) => {
            invokeAdapter('updateRecord', JSON.stringify(goodConfig), (responseValue) => {
                const { data, error } = responseValue;
                expect(data).toBeDefined();
                expect(error).toBeUndefined();
                resolve(undefined);
            });
        });
        let drafts = await draftManager.getQueue();
        expect(drafts.items.length).toBe(1);
        const createdDraft = drafts.items[0];

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
                () => {
                    onSnapshotCount += 1;
                    if (onSnapshotCount === 1) {
                        resolve(undefined);
                    }
                }
            );
        });

        await getRecordPromise;

        const onResponse: OnResponse = (value) => {
            const { error } = value;
            expect(error).toBeDefined();
            expect(error.statusText).toEqual('Bad Request');
            const anyBody = error.body as any;
            expect(anyBody.message).toEqual('the adapter did not generate a draft');
        };

        const config: UpdateRecordConfig = {
            fields: { NonExistantField: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        invokeAdapterWithDraftToReplace(
            'updateRecord',
            JSON.stringify(config),
            createdDraft.id,
            onResponse
        );
    });

    it('errors when called with a non-existent draft id', async (done) => {
        invokeAdapterWithDraftToReplace('updateRecord', '', 'notadraftid', (result) => {
            const { data, error } = result;
            expect(data).toBeUndefined();
            const anyBody = error.body as any;
            expect(anyBody.message).toEqual('the specified draft does not exist');
            done();
        });
    });
});
