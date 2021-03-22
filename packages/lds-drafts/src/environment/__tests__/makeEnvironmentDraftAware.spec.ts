import { setupDraftEnvironment } from './test-utils';

describe('makeEnvironmentDraftAware', () => {
    it('does not start the draft queue', async () => {
        const { draftQueue } = setupDraftEnvironment();
        expect(draftQueue.startQueue).toBeCalledTimes(0);
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
});
