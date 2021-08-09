import {
    mockActivateCalcProcedureVersionNetworkOnce,
    mockActivateCalcProcedureVersionNetworkErrorOnce,
} from 'industries-rule-builder-test-util';
import { activateCalcProcedureVersion } from 'lds-adapters-industries-rule-builder';
import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/activateCalcProcedureVersion/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('test basic success activateCalcProcedureVersion', async () => {
        const mock = getMock('activationResponseWithoutError');
        const config = {
            id: 'testId',
            action: 'activate',
        };
        mockActivateCalcProcedureVersionNetworkOnce(config, mock);

        const el = await activateCalcProcedureVersion(config);
        expect(el).toEqual(mock);
    });

    it('test activateCalcProcedureVersion with 404 error', async () => {
        const config = {
            id: 'testId',
            action: 'activate',
        };
        const mockErrorResponse = {
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
        mockActivateCalcProcedureVersionNetworkErrorOnce(config, mockErrorResponse);
        try {
            await activateCalcProcedureVersion(config);
            fail('activateCalcProcedureVersion did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
        }
    });
});
