import { updateTarget } from 'lds-adapters-analytics-data-service';
import { getMock as globalGetMock } from 'test-util';
import {
    mockUpdateTargetNetworkOnce,
    mockUpdateTargetNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/updateTarget/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('updates a target', async () => {
        const mock = getMock('target');
        const config = {
            id: 'c11fdb87-a196-46aa-8b44-5ad6e9e253c5',
            targetInput: {
                connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                sourceObject: { name: 'Account' },
                fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
            },
        };
        mockUpdateTargetNetworkOnce(config, mock);

        const data = await updateTarget(config);

        expect(data).toEqual(mock);
    });

    it('displays error when network request 404s', async (done) => {
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
            id: 'c11fdb87-a196-46aa-8b44-5ad6e9e253c5',
            targetInput: {
                connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                sourceObject: { name: 'Account' },
                fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
            },
        };
        mockUpdateTargetNetworkErrorOnce(config, mock);

        try {
            await updateTarget(config);
            // make sure we are hitting the catch
            done.fail('updateTarget did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
        }
        done();
    });
});
