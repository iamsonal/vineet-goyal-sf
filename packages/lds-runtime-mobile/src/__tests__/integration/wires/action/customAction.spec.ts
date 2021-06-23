import { Action, DraftAction, DraftQueue, ProcessActionResult } from '@salesforce/lds-drafts';
import {
    CustomActionData,
    CustomActionResult,
    CustomActionResultType,
} from '@salesforce/lds-drafts/src/actionHandlers/CustomActionHandler';
import { JSONStringify } from '@salesforce/lds-drafts/src/utils/language';
import { MockNimbusNetworkAdapter } from '../../../MockNimbusNetworkAdapter';
import { flushPromises } from '../../../testUtils';
import { setup } from '../integrationTestSetup';

import mockAccount from '../data/record-Account-fields-Account.Id,Account.Name.json';

export const OBJECT_INFO_PREFIX_SEGMENT = 'OBJECT_INFO_PREFIX_SEGMENT';
const API_NAME = 'Account';
const CUSTOM_HANDLER = 'CUSTOM';
const DEFAULT_CUSTOM_ACTION: Action<CustomActionData> = {
    data: { some: 'data' },
    handler: CUSTOM_HANDLER,
    targetId: '1234',
    tag: '1234',
};

describe('mobile runtime integration tests on actions', () => {
    let draftQueue: DraftQueue;
    let networkAdapter: MockNimbusNetworkAdapter;
    let createRecord;

    beforeEach(async () => {
        ({ createRecord, draftQueue, networkAdapter } = await setup());
        // each test sets its own custom handler, remove before next test
        draftQueue.removeHandler(CUSTOM_HANDLER);
    });

    it('custom handler added gets call back', async () => {
        const callbackSpy = jest.fn();
        draftQueue.addCustomHandler(CUSTOM_HANDLER, callbackSpy);

        await draftQueue.enqueue(DEFAULT_CUSTOM_ACTION);

        await draftQueue.processNextAction();
        expect(callbackSpy).toBeCalledTimes(1);
    });

    it('success callback removes item from queue', async () => {
        draftQueue.addCustomHandler(
            CUSTOM_HANDLER,
            async (
                action: DraftAction<unknown, unknown>,
                complete: (result: CustomActionResult) => void
            ) => {
                complete({
                    id: action.id,
                    type: CustomActionResultType.SUCCESS,
                });
            }
        );

        await draftQueue.enqueue(DEFAULT_CUSTOM_ACTION);

        expect((await draftQueue.getQueueActions()).length).toBe(1);
        await draftQueue.processNextAction();

        // wait for completed handlers to be called
        await flushPromises();

        const actions = await draftQueue.getQueueActions();
        expect(actions.length).toBe(0);
    });

    it('only handles custom actions', async () => {
        draftQueue.addCustomHandler(
            CUSTOM_HANDLER,
            async (
                action: DraftAction<unknown, unknown>,
                complete: (result: CustomActionResult) => void
            ) => {
                complete({
                    id: action.id,
                    type: CustomActionResultType.SUCCESS,
                });
            }
        );

        await createRecord({
            apiName: API_NAME,
            fields: { Name: 'Justin' },
        });

        networkAdapter.setMockResponse({
            status: 201,
            headers: {},
            body: JSONStringify(mockAccount),
        });

        await draftQueue.enqueue(DEFAULT_CUSTOM_ACTION);
        const result = await draftQueue.processNextAction();
        const result2 = await draftQueue.processNextAction();

        expect(result).toBe(ProcessActionResult.ACTION_SUCCEEDED);
        expect(result2).toBe(ProcessActionResult.CUSTOM_ACTION_WAITING);

        // wait for completed handlers to be called
        await flushPromises();

        const actions = await draftQueue.getQueueActions();
        expect(actions.length).toBe(0);
    });
});
