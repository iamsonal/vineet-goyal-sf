import { Environment, FetchResponse, Store } from '@luvio/engine';
import { DurableStore, makeDurable } from '@luvio/environments';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    CompletedDraftAction,
    DraftActionStatus,
    DraftQueue,
    DraftQueueChangeListener,
    DraftQueueEventType,
} from '../../DraftQueue';
import { makeEnvironmentDraftAware } from '../makeEnvironmentDraftAware';
import {
    setupDraftEnvironment,
    createPostDraftAction,
    createTestRecord,
    DEFAULT_NAME_FIELD_VALUE,
    RECORD_ID,
    STORE_KEY_DRAFT_RECORD,
    STORE_KEY_RECORD,
    flushPromises,
} from './test-utils';

describe('makeEnvironmentDraftAware', () => {
    it('starts the draft queue', async () => {
        const { draftQueue } = setupDraftEnvironment();
        expect(draftQueue.startQueue).toBeCalledTimes(1);
    });

    describe('dispatchResourceRequest', () => {
        it('does not intercept non record endpoints', async () => {
            const { draftEnvironment, network } = setupDraftEnvironment();
            await draftEnvironment.dispatchResourceRequest({
                baseUri: '/services/data/v52.0',
                basePath: `/ui-api/not-record-endpoint`,
                method: 'patch',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            });
            expect(network).toBeCalledTimes(1);
        });
    });

    describe('draftQueueCompletedListener', () => {
        it('draft id redirects get configured after a post action completes', async () => {
            const store = new Store();
            const network = jest.fn();
            let registeredListener: DraftQueueChangeListener;
            const durableStore: DurableStore = {
                setEntries: jest.fn(),
                getEntries: jest.fn(),
                getAllEntries: jest.fn(),
                evictEntries: jest.fn(),
                registerOnChangedListener: jest.fn(),
            };
            const draftQueue: DraftQueue = {
                enqueue: jest.fn().mockResolvedValue(undefined),
                getActionsForTags: jest.fn(),
                registerOnChangedListener: listener => {
                    registeredListener = listener;
                    return () => {
                        return Promise.resolve();
                    };
                },
                processNextAction: jest.fn(),
                getQueueActions: jest.fn(),
                getQueueState: jest.fn(),
                startQueue: jest.fn(),
                stopQueue: jest.fn(),
                removeDraftAction: jest.fn(),
            };

            const baseEnvironment = makeDurable(new Environment(store, network), { durableStore });
            makeEnvironmentDraftAware(baseEnvironment, {
                store,
                draftQueue,
                durableStore,
                ingestFunc: (_record: any, _path: any, _store: any, _timestamp: any) => {},
                generateId: (_prefix: string) => {
                    return 'generatedId';
                },
                isDraftId: _id => true,
                recordResponseRetrievers: [],
            });

            expect(registeredListener).toBeDefined();

            const response: FetchResponse<RecordRepresentation> = {
                body: createTestRecord(RECORD_ID, DEFAULT_NAME_FIELD_VALUE, 'Justin', 1),
                status: 201,
                statusText: 'ok',
                ok: true,
                headers: {},
            };

            const action = {
                ...createPostDraftAction(STORE_KEY_DRAFT_RECORD, 'Justin', 'Account'),
                status: DraftActionStatus.Completed,
                response,
            } as CompletedDraftAction<RecordRepresentation>;

            registeredListener({
                type: DraftQueueEventType.ActionCompleted,
                action,
            });

            await flushPromises();

            const setSpy = durableStore.setEntries as jest.Mock;

            expect(durableStore.setEntries).toBeCalledTimes(1);
            const durableEntry = setSpy.mock.calls[0][0];
            const mappingKey = `DraftIdMapping::${STORE_KEY_DRAFT_RECORD}::${STORE_KEY_RECORD}`;
            const mapping = durableEntry[mappingKey].data;
            const expiration = durableEntry[mappingKey].expiration;
            expect(mapping).toEqual({
                draftKey: STORE_KEY_DRAFT_RECORD,
                canonicalKey: STORE_KEY_RECORD,
            });
            expect(expiration).toBeDefined();
            expect(setSpy.mock.calls[0][1]).toBe('DRAFT_ID_MAPPINGS');
        });
    });
});
