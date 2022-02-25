import timekeeper from 'timekeeper';
import { addMockNetworkResponse, resetMockNetworkAdapter } from './mocks/mockNimbusNetwork';
import { OnResponse } from '../executeAdapter';
import objectInfo_Account from './mockData/objectInfo-Account.json';
import recordRep_Account from './mockData/RecordRepresentation-Account.json';
import recordRep_Account_Edited from './mockData/RecordRepresentation-Account-Edited.json';
import userId from '../standalone-stubs/salesforce-user-id';
import { UpdateRecordConfig } from '@salesforce/lds-adapters-uiapi';
import { stripProperties } from '@luvio/adapter-test-library';
import { recordEndpointPath, objectInfoAccountPath } from './urlPaths';
import { flushPromises } from './utils';

describe('nativeAdapterRequestContext', () => {
    let invokeAdapterWithMetadata,
        mockDeleteRecord = jest.fn();

    beforeAll(() => {
        jest.mock('../lightningAdapterApi', () => {
            const original = jest.requireActual('../lightningAdapterApi');

            return {
                ...original,
                dmlAdapterMap: {
                    ...original.dmlAdapterMap,
                    deleteRecord: mockDeleteRecord,
                },
            };
        });

        ({ invokeAdapterWithMetadata } = require('../executeAdapter'));
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterAll(() => {
        jest.unmock('../lightningAdapterApi');
    });

    it('should pass the request metadata', (done) => {
        // Arrange
        const observabilityContext = {
            rootId: 'priming-root-id',
            isRootActivitySampled: true,
            traceId: 'uuid-trace-id',
        };
        const theMetadata = { theMetadata: 'that is expected' };
        const onResponse = () => {
            assert();
            done();
        };

        // Act
        invokeAdapterWithMetadata(
            'deleteRecord',
            JSON.stringify(recordRep_Account.id),
            theMetadata,
            onResponse,
            {
                priority: 'high',
                observabilityContext,
            }
        );

        // Assert
        function assert() {
            expect(mockDeleteRecord).toBeCalledTimes(1);
            expect(mockDeleteRecord).toHaveBeenCalledWith(recordRep_Account.id, {
                cachePolicy: undefined,
                priority: 'high',
                requestCorrelator: {
                    observabilityContext,
                },
            });
        }
    });

    it('should pass the default metadata as undefined', (done) => {
        // Arrange
        const theMetadata = { theMetadata: 'that is expected' };
        const onResponse = () => {
            assert();
            done();
        };

        // Act
        invokeAdapterWithMetadata(
            'deleteRecord',
            JSON.stringify(recordRep_Account.id),
            theMetadata,
            onResponse
        );

        // Assert
        function assert() {
            expect(mockDeleteRecord).toBeCalledTimes(1);
            expect(mockDeleteRecord).toHaveBeenCalledWith(recordRep_Account.id, undefined);
        }
    });
});

describe('invokeAdapterWithMetadata', () => {
    let invokeAdapter, subscribeToAdapter, draftManager, invokeAdapterWithMetadata;

    beforeEach(async () => {
        await flushPromises();
        jest.resetModules();
        ({
            invokeAdapter,
            subscribeToAdapter,
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

    it('creates a draft with the correct metadata', async (done) => {
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

        const testUpdatedDate = new Date();
        timekeeper.freeze(testUpdatedDate);

        const newNameFieldValue = recordRep_Account_Edited.fields.Name.value;
        // for now optimistic responses populate "displayValue" by calling value.toString()
        const optimisticNameField = { value: newNameFieldValue, displayValue: newNameFieldValue };
        // draft action IDs are current timestamp plus a double digit index
        const draftId = `${testUpdatedDate.valueOf()}00`;
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
                draftActionIds: [draftId],
                latestDraftActionId: draftId,
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
                () => {
                    onSnapshotCount += 1;
                    if (onSnapshotCount === 1) {
                        resolve(undefined);
                    }
                }
            );
        });

        await getRecordPromise;

        const theMetadata = { theMetadata: 'that is expected' };

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

            draftManager.getQueue().then((drafts) => {
                expect(drafts.items.length).toBe(1);
                const firstDraft = drafts.items[0];
                expect(firstDraft).toBeDefined();
                const expectedMetadata = {
                    LDS_ACTION_METADATA_API_NAME: 'Account',
                    ...theMetadata,
                };
                expect(firstDraft.metadata).toEqual(expectedMetadata);
                done();
            });
        };

        const config: UpdateRecordConfig = {
            fields: { Name: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        invokeAdapterWithMetadata('updateRecord', JSON.stringify(config), theMetadata, onResponse);
    });

    it('creates a draft with the correct metadata with deleteRecord', async (done) => {
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

        const theMetadata = { theMetadata: 'that is expected' };
        const onResponse: OnResponse = (value) => {
            const { data, error } = value;
            // currently drafts response doesn't get all fields, just the modified ones
            expect(data).toBeUndefined();
            expect(error).toBeUndefined();

            draftManager.getQueue().then((drafts) => {
                expect(drafts.items.length).toBe(1);
                const firstDraft = drafts.items[0];
                expect(firstDraft).toBeDefined();
                const expectedMetadata = {
                    LDS_ACTION_METADATA_API_NAME: 'Account',
                    ...theMetadata,
                };
                expect(firstDraft.metadata).toEqual(expectedMetadata);
                done();
            });
        };
        invokeAdapterWithMetadata(
            'deleteRecord',
            JSON.stringify(recordRep_Account.id),
            theMetadata,
            onResponse
        );
    });

    it('errors when calling with an adapter that is not mutating', async (done) => {
        const onResponse: OnResponse = (value) => {
            const { data, error } = value;
            expect(data).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.statusText).toEqual('Bad Request');
            const anyBody = error.body as any;
            expect(anyBody.message).toEqual('adapterId must be a mutating adapter');
            done();
        };
        invokeAdapterWithMetadata('getRecord', '', {}, onResponse);
    });

    it('sends a custom error when the mutating adapter did not create a draft', async (done) => {
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

        const testUpdatedDate = new Date();
        timekeeper.freeze(testUpdatedDate);

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
                () => {
                    onSnapshotCount += 1;
                    if (onSnapshotCount === 1) {
                        resolve(undefined);
                    }
                }
            );
        });

        await getRecordPromise;

        const theMetadata = { theMetadata: 'that is expected' };

        const onResponse: OnResponse = (value) => {
            const { error } = value;
            expect(error).toBeDefined();
            expect(error.statusText).toEqual('Bad Request');
            const anyBody = error.body as any;
            expect(anyBody.message).toEqual('the adapter did not generate a draft');
            //TODO: W-9765991 - We should assert here that a draft wasn't actually created
            done();
        };

        const config: UpdateRecordConfig = {
            fields: { NonExistantField: recordRep_Account_Edited.fields.Name.value },
            recordId: recordRep_Account.id,
        };

        invokeAdapterWithMetadata('updateRecord', JSON.stringify(config), theMetadata, onResponse);
    });
});
