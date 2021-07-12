import { ResourceRequest } from '@luvio/engine';
import {
    DRAFT_RECORD_ID,
    RECORD_ID,
    setupDraftEnvironment,
    STORE_KEY_DRAFT_RECORD,
    STORE_KEY_RECORD,
} from './test-utils';

function buildRequest(id: string, fields: string[], optionalFields: string[]): ResourceRequest {
    return {
        basePath: `/ui-api/records/${id}`,
        baseUri: '',
        queryParams: {
            fields,
            optionalFields,
        },
        urlParams: {
            recordId: id,
        },
        method: 'get',
        body: undefined,
        headers: {},
    };
}

describe('draft environment tests', () => {
    describe('getRecord', () => {
        it('does not intercept record get endpoint on non-draft id', async () => {
            const { draftEnvironment, network } = await setupDraftEnvironment();
            draftEnvironment.dispatchResourceRequest(buildRequest(RECORD_ID, ['Account.Name'], []));
            expect(network).toBeCalledTimes(1);
        });

        it('replaces draft id with canonical id in get requests', async () => {
            const { draftEnvironment, network } = await setupDraftEnvironment();
            draftEnvironment.storeRedirect(STORE_KEY_DRAFT_RECORD, STORE_KEY_RECORD);
            draftEnvironment.dispatchResourceRequest(
                buildRequest(DRAFT_RECORD_ID, ['Account.Name'], [])
            );
            expect(network).toBeCalledTimes(1);
            expect(network.mock.calls[0][0].basePath).toBe(`/ui-api/records/${RECORD_ID}`);
        });
    });
});
