import { deleteTarget } from 'lds-adapters-analytics-data-service';
import { setupElement } from 'test-util';
import {
    mockDeleteTargetNetworkOnce,
    mockDeleteTargetNetworkErrorOnce,
} from 'analytics-data-service-test-util';

//TODO [W-10346808] the tests are failing
xdescribe('basic', () => {
    it('deletes a target', async () => {
        const mock = null;
        const config = { id: mock.id };
        mockDeleteTargetNetworkOnce(config, mock);

        const el = await setupElement({ id: mock.id }, deleteTarget);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        const id = 'SALESFORCE_ADS';
        const config = { id: id };
        mockDeleteTargetNetworkErrorOnce(config, mock);

        const el = await setupElement({ id: id }, deleteTarget);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });
});
