import {
    DRAFT_RECORD_ID,
    RECORD_ID,
    setupDraftEnvironment,
    STORE_KEY_DRAFT_RECORD,
    STORE_KEY_RECORD,
} from './test-utils';

describe('draft environment tests', () => {
    describe('getRecord', () => {
        it('does not intercept record get endpoint on non-draft id', () => {
            const { draftEnvironment, network } = setupDraftEnvironment();
            draftEnvironment.dispatchResourceRequest({
                baseUri: '/services/data/v52.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'get',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            });
            expect(network).toBeCalledTimes(1);
        });

        it('replaces draft id with canonical id in get requests', () => {
            const { draftEnvironment, network } = setupDraftEnvironment();
            draftEnvironment.storeRedirect(STORE_KEY_DRAFT_RECORD, STORE_KEY_RECORD);
            draftEnvironment.dispatchResourceRequest({
                baseUri: '/services/data/v52.0',
                basePath: `/ui-api/records/${DRAFT_RECORD_ID}`,
                method: 'get',
                body: {},
                urlParams: {
                    recordId: DRAFT_RECORD_ID,
                },
                queryParams: {},
                headers: {},
            });
            expect(network).toBeCalledTimes(1);
            expect(network.mock.calls[0][0].basePath).toBe(`/ui-api/records/${RECORD_ID}`);
        });
    });
});
