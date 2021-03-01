import { ResponsePropertyRetriever } from '@luvio/environments';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { DraftQueue } from '../DraftQueue';
import { makeNetworkAdapterDraftAware } from '../makeNetworkAdapterDraftAware';
import {
    createEditDraftAction,
    createGetRequest,
    RECORD_ID,
    STORE_KEY_RECORD,
    CURRENT_USER_ID,
    DEFAULT_TIME_STAMP,
} from './test-utils';

function setup(
    setupOptions: {
        mockNetworkResponse?: any;
        recordResponseRetrievers?: ResponsePropertyRetriever<unknown, RecordRepresentation>[];
    } = {}
) {
    const { mockNetworkResponse, recordResponseRetrievers } = setupOptions;

    const baseNetworkAdapter = jest.fn().mockResolvedValue(mockNetworkResponse ?? {});
    const draftQueue: DraftQueue = {
        enqueue: jest.fn(),
        getActionsForTags: jest.fn(),
        processNextAction: jest.fn(),
        registerOnChangedListener: jest.fn(),
        getQueueActions: jest.fn(),
        getQueueState: jest.fn(),
        removeDraftAction: jest.fn(),
        replaceAction: jest.fn(),
        startQueue: jest.fn(),
        stopQueue: jest.fn(),
    };
    const draftNetworkAdapter = makeNetworkAdapterDraftAware(
        baseNetworkAdapter,
        draftQueue,
        recordResponseRetrievers ?? [],
        CURRENT_USER_ID
    );

    return {
        baseNetworkAdapter,
        draftNetworkAdapter,
        draftQueue,
    };
}

describe('makeNetworkAdapterDraftAware', () => {
    it('calls retrieve on response body if canRetrieve is true', async () => {
        const mockNetworkResponse = {};
        const mockRetriever: ResponsePropertyRetriever<any, any> = {
            canRetrieve: jest.fn().mockImplementation(() => true),
            retrieve: jest.fn().mockImplementation(() => []),
        };
        const { draftNetworkAdapter, draftQueue } = setup({
            recordResponseRetrievers: [mockRetriever],
            mockNetworkResponse,
        });

        const environmentResponse = await draftNetworkAdapter(createGetRequest());

        expect(environmentResponse).toBe(mockNetworkResponse);
        expect(mockRetriever.canRetrieve).toHaveBeenCalledTimes(1);
        expect(mockRetriever.retrieve).toHaveBeenCalledWith(mockNetworkResponse);

        // since the mock retriever doesn't return any records we shouldn't need
        // to call the draftQueue
        expect(draftQueue.getActionsForTags).toHaveBeenCalledTimes(0);
    });

    it('does not call retrieve on response body if canRetrieve is false', async () => {
        const mockNetworkResponse = {};
        const mockRetriever: ResponsePropertyRetriever<any, any> = {
            canRetrieve: jest.fn().mockImplementation(() => false),
            retrieve: jest.fn().mockImplementation(() => []),
        };
        const { draftNetworkAdapter } = setup({
            recordResponseRetrievers: [mockRetriever],
            mockNetworkResponse,
        });

        const environmentResponse = await draftNetworkAdapter(createGetRequest());

        expect(environmentResponse).toBe(mockNetworkResponse);
        expect(mockRetriever.canRetrieve).toHaveBeenCalledTimes(1);
        expect(mockRetriever.retrieve).toHaveBeenCalledTimes(0);
    });

    it('returns response without changes if no retrievers', async () => {
        const mockNetworkResponse = {};
        const { draftNetworkAdapter } = setup({
            mockNetworkResponse,
            recordResponseRetrievers: [],
        });

        const environmentResponse = await draftNetworkAdapter(createGetRequest());

        expect(environmentResponse).toBe(mockNetworkResponse);
    });

    it('should overlay draft edits', async () => {
        const originalName = 'oldName';
        const draftName = 'newName';
        const mockNetworkResponse: RecordRepresentation = {
            id: RECORD_ID,
            weakEtag: 1,
            fields: {
                Name: {
                    value: originalName,
                    displayValue: null,
                },
            },
        } as any;

        const mockRetriever: ResponsePropertyRetriever<any, any> = {
            canRetrieve: jest.fn().mockImplementation(() => true),
            retrieve: response => {
                // this retriever returns the top-level response
                return [{ cacheKey: STORE_KEY_RECORD, data: response }];
            },
        };
        const { draftNetworkAdapter, draftQueue } = setup({
            recordResponseRetrievers: [mockRetriever],
            mockNetworkResponse,
        });
        const editAction = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD, draftName);
        draftQueue.getActionsForTags = jest.fn().mockResolvedValue({
            [STORE_KEY_RECORD]: [editAction],
        });

        // execute
        const overlayedResponse = await draftNetworkAdapter(createGetRequest());

        // assert
        const expectedLastModifiedDate = new Date(DEFAULT_TIME_STAMP).toISOString();
        expect(overlayedResponse).toEqual({
            id: RECORD_ID,
            weakEtag: 1,
            lastModifiedById: CURRENT_USER_ID,
            lastModifiedDate: expectedLastModifiedDate,
            fields: {
                Name: {
                    value: draftName,
                    displayValue: draftName,
                },
                LastModifiedById: {
                    value: CURRENT_USER_ID,
                    displayValue: null,
                },
                LastModifiedDate: {
                    value: expectedLastModifiedDate,
                    displayValue: expectedLastModifiedDate,
                },
            },
            drafts: {
                created: false,
                edited: true,
                deleted: false,
                serverValues: {
                    Name: {
                        value: originalName,
                        displayValue: null,
                    },
                },
                draftActionIds: [editAction.id],
            },
        });
    });

    it('should overlay multiple draft edits', async () => {
        const originalName = 'oldName';
        const draftName1 = 'newName1';
        const draftName2 = 'newName2';
        const mockNetworkResponse: RecordRepresentation = {
            id: RECORD_ID,
            weakEtag: 1,
            fields: {
                Name: {
                    value: originalName,
                    displayValue: null,
                },
            },
        } as any;

        const mockRetriever: ResponsePropertyRetriever<any, any> = {
            canRetrieve: jest.fn().mockImplementation(() => true),
            retrieve: response => {
                // this retriever returns the top-level response
                return [{ cacheKey: STORE_KEY_RECORD, data: response }];
            },
        };
        const { draftNetworkAdapter, draftQueue } = setup({
            recordResponseRetrievers: [mockRetriever],
            mockNetworkResponse,
        });
        const editActionOne = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD, draftName1);
        const editActionTwo = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD, draftName2);
        draftQueue.getActionsForTags = jest.fn().mockResolvedValue({
            [STORE_KEY_RECORD]: [editActionOne, editActionTwo],
        });

        // execute
        const overlayedResponse = await draftNetworkAdapter(createGetRequest());

        const expectedLastModifiedDate = new Date(DEFAULT_TIME_STAMP).toISOString();
        // assert
        expect(overlayedResponse).toStrictEqual({
            id: RECORD_ID,
            weakEtag: 1,
            lastModifiedById: CURRENT_USER_ID,
            lastModifiedDate: expectedLastModifiedDate,
            fields: {
                Name: {
                    value: draftName2,
                    displayValue: draftName2,
                },
                LastModifiedById: {
                    value: CURRENT_USER_ID,
                    displayValue: null,
                },
                LastModifiedDate: {
                    value: expectedLastModifiedDate,
                    displayValue: expectedLastModifiedDate,
                },
            },
            drafts: {
                created: false,
                edited: true,
                deleted: false,
                serverValues: {
                    Name: {
                        value: originalName,
                        displayValue: null,
                    },
                },
                draftActionIds: [editActionOne.id, editActionTwo.id],
            },
        });
    });
});
