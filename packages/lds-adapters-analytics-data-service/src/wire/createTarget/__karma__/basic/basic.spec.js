import { createTarget } from 'lds-adapters-analytics-data-service';
import { getMock as globalGetMock } from 'test-util';
import {
    mockCreateTargetNetworkOnce,
    mockCreateTargetNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/createTarget/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('creates a target', async () => {
        const mock = getMock('target');
        const config = {
            targetInput: {
                connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                sourceObject: { name: 'Account' },
                fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
            },
        };
        mockCreateTargetNetworkOnce(config, mock);

        const data = await createTarget(config);

        expect(data).toEqual(mock);
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
        const config = {
            targetInput: {
                connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                sourceObject: { name: 'Account' },
                fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
            },
        };
        mockCreateTargetNetworkErrorOnce(config, mock);

        try {
            await createTarget(config);
            // make sure we are hitting the catch
            fail('createRecord did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
        }
    });
});
