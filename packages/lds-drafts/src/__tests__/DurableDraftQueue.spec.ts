import { DraftActionStatus, ProcessActionResult } from '../DraftQueue';
import { DurableDraftQueue, DraftDurableSegment } from '../DurableDraftQueue';
import {
    MockDurableStore,
    buildMockNetworkAdapter,
    getMockNetworkAdapterCallCount,
    MockPayload,
    buildSuccessMockPayload,
    buildErrorMockPayload,
    setNetworkConnectivity,
    ConnectivityState,
} from '@ldsjs/adapter-test-library';
import { ObjectKeys } from '../utils/language';
import { DurableStoreEntry, DurableStoreEntries } from '@ldsjs/environments';
import { createPatchRequest, createPostRequest } from './test-utils';

describe('DurableDraftQueue', () => {
    it('cannot create post action on record that already exists', async () => {
        const network = buildMockNetworkAdapter([]);
        const durableStore = new MockDurableStore();
        const draftQueue = new DurableDraftQueue(durableStore, network);
        const draftId = 'fooId';

        await draftQueue.enqueue(
            {
                method: 'post',
                basePath: 'blah',
                baseUri: 'blahuri',
                body: null,
                queryParams: {},
                urlParams: {},
                headers: {},
            },
            draftId
        );

        // TODO: Clean up this test structure to use expect
        let caughtError = undefined;
        try {
            await draftQueue.enqueue(
                {
                    method: 'post',
                    basePath: 'blah',
                    baseUri: 'blahuri',
                    body: null,
                    queryParams: {},
                    urlParams: {},
                    headers: {},
                },
                draftId
            );
        } catch (e) {
            caughtError = e;
        }
        expect(caughtError).toBeDefined();
    });

    it('cannot publish draft action after a delete action is added', async () => {
        const network = buildMockNetworkAdapter([]);
        const durableStore = new MockDurableStore();
        const draftStore = new DurableDraftQueue(durableStore, network);
        // const draftNamePatch = 'Updated Name Field';
        const draftId = 'fooId';

        await draftStore.enqueue(
            {
                method: 'post',
                basePath: 'blah',
                baseUri: 'blahuri',
                body: null,
                queryParams: {},
                urlParams: {},
                headers: {},
            },
            draftId
        );

        await draftStore.enqueue(
            {
                method: 'delete',
                basePath: 'blah',
                baseUri: 'blahuri',
                body: null,
                queryParams: {},
                urlParams: {},
                headers: {},
            },
            draftId
        );

        // TODO: Clean up this test structure to use expect
        var caughtError = undefined;
        try {
            await draftStore.enqueue(
                {
                    method: 'patch',
                    basePath: 'blah',
                    baseUri: 'blahuri',
                    body: null,
                    queryParams: {},
                    urlParams: {},
                    headers: {},
                },
                draftId
            );
        } catch (e) {
            caughtError = e;
        }
        expect(caughtError).toBeDefined();
    });

    it('can enqueue multiple draft actions', async () => {
        const network = buildMockNetworkAdapter([]);
        const durableStore = new MockDurableStore();
        const draftStore = new DurableDraftQueue(durableStore, network);
        setNetworkConnectivity(network, ConnectivityState.Offline);

        await draftStore.enqueue(createPostRequest(), 'testTag');
        await draftStore.enqueue(createPostRequest(), 'testTagTwo');

        const actions = await draftStore.getActionsForTags({ testTag: true, testTagTwo: true });
        expect(actions['testTagTwo'].length).toEqual(1);
        expect(actions['testTag'].length).toEqual(1);
    });

    it('rehydrates queue from durable store', async () => {
        const network = buildMockNetworkAdapter([]);
        const durableStore = new MockDurableStore();
        const draftStore = new DurableDraftQueue(durableStore, network);

        const request = {
            method: 'post',
            basePath: 'blah',
            baseUri: 'blahuri',
            body: null,
            queryParams: {},
            urlParams: {},
            headers: {},
        };
        const testAction = {
            id: 123456,
            status: DraftActionStatus.Pending,
            tag: 'testActionTag',
            request,
            data: {},
        };
        const entry: DurableStoreEntry = { data: testAction };
        durableStore.segments[DraftDurableSegment] = {};
        durableStore.segments[DraftDurableSegment]['123456'] = entry;

        const actions = await draftStore.getActionsForTags({ testActionTag: true });
        expect(actions['testActionTag'][0]).toStrictEqual(testAction);
    });

    it('sorts draft actions into correct order', async () => {
        const network = buildMockNetworkAdapter([]);
        const durableStore = new MockDurableStore();
        const draftStore = new DurableDraftQueue(durableStore, network);

        const request = {
            method: 'post',
            basePath: 'blah',
            baseUri: 'blahuri',
            body: null,
            queryParams: {},
            urlParams: {},
            headers: {},
        };
        const testAction = {
            id: 123456,
            status: DraftActionStatus.Pending,
            tag: 'testActionTag',
            request,
            data: {},
        };
        const testActionTwo = {
            id: 123457,
            status: DraftActionStatus.Pending,
            tag: 'testActionTag',
            request,
            data: {},
        };
        const entry: DurableStoreEntry = { data: testAction };
        const entryTwo: DurableStoreEntry = { data: testActionTwo };
        const entryID = testAction.id.toString();
        const entryTwoID = testActionTwo.id.toString();
        const entries: DurableStoreEntries = { [entryTwoID]: entryTwo, [entryID]: entry };
        durableStore.setEntries(entries, DraftDurableSegment);

        const actions = await draftStore.getActionsForTags({ testActionTag: true });
        const testActions = actions['testActionTag'];
        expect(testActions).toBeDefined();
        expect(testActions[0].id).toEqual(123456);
        expect(testActions[1].id).toEqual(123457);
    });

    it('calls the durable store when enqueuing', async () => {
        const network = buildMockNetworkAdapter([]);
        const durableStore = new MockDurableStore();
        const draftStore = new DurableDraftQueue(durableStore, network);

        await draftStore.enqueue(createPatchRequest(), 'testTag');
        const allEntries = await durableStore.getAllEntries(DraftDurableSegment);
        expect(ObjectKeys(allEntries).length).toEqual(1);
    });

    it('resolves to no action to process for empty queue', async () => {
        const network = buildMockNetworkAdapter([]);
        const durableStore = new MockDurableStore();
        const draftStore = new DurableDraftQueue(durableStore, network);

        const result = await draftStore.processNextAction();
        expect(result).toEqual(ProcessActionResult.NO_ACTION_TO_PROCESS);
    });

    it('successful action results in success', async () => {
        const createArgs: MockPayload['networkArgs'] = {
            method: 'post',
            basePath: '/blah',
        };
        const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
        const network = buildMockNetworkAdapter([successPayload]);
        const durableStore = new MockDurableStore();
        const evictSpy = jest.spyOn(durableStore, 'evictEntries');
        const draftStore = new DurableDraftQueue(durableStore, network);
        const request = {
            method: 'post',
            basePath: '/blah',
            baseUri: 'blahuri',
            body: null,
            queryParams: {},
            urlParams: {},
            headers: {},
        };
        await draftStore.enqueue(request, 'testTag');
        const allDrafts = await durableStore.getAllEntries(DraftDurableSegment);
        expect(ObjectKeys(allDrafts).length).toEqual(1);

        const result = await draftStore.processNextAction();
        expect(result).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
        const callCount = getMockNetworkAdapterCallCount(network);
        expect(callCount).toEqual(1);
        expect(evictSpy).toBeCalledTimes(1);
    });

    // item in process in queue results in action already processing
    it('item in progress returns in process result', async () => {
        const createArgs: MockPayload['networkArgs'] = {
            method: 'post',
            basePath: '/blah',
        };
        const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
        const network = buildMockNetworkAdapter([successPayload]);
        setNetworkConnectivity(network, ConnectivityState.Offline);
        const durableStore = new MockDurableStore();
        const draftStore = new DurableDraftQueue(durableStore, network);
        const request = {
            method: 'post',
            basePath: '/blah',
            baseUri: 'blahuri',
            body: null,
            queryParams: {},
            urlParams: {},
            headers: {},
        };
        await draftStore.enqueue(request, 'testTag');

        const result = await draftStore.processNextAction();
        const resultTwo = await draftStore.processNextAction();
        expect(result).toEqual(ProcessActionResult.ACTION_ERRORED);
        expect(resultTwo).toEqual(ProcessActionResult.ACTION_ALREADY_PROCESSING);
        const callCount = getMockNetworkAdapterCallCount(network);
        expect(callCount).toEqual(1);
    });

    // item in queue that errors results in action errored
    it('error results in action error result', async () => {
        const createArgs: MockPayload['networkArgs'] = {
            method: 'post',
            basePath: '/blah',
        };

        const errorPayload: MockPayload = buildErrorMockPayload(createArgs, {}, 401, 'error');
        const network = buildMockNetworkAdapter([errorPayload]);
        const durableStore = new MockDurableStore();
        const draftStore = new DurableDraftQueue(durableStore, network);
        const request = {
            method: 'post',
            basePath: '/blah',
            baseUri: 'blahuri',
            body: null,
            queryParams: {},
            urlParams: {},
            headers: {},
        };
        await draftStore.enqueue(request, 'testTag');

        const result = await draftStore.processNextAction();
        expect(result).toEqual(ProcessActionResult.ACTION_ERRORED);
        let allDrafts = await durableStore.getAllEntries(DraftDurableSegment);
        expect(ObjectKeys(allDrafts).length).toEqual(1);
    });
});
