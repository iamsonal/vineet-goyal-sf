import GetDecisionMatrixDetails from '../lwc/get-decision-matrix-details';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetDecisionMatricDetailsNetworkOnce,
    mockDecisionMatricDetailsNetworkErrorOnce,
} from 'industries-rule-builder-test-util';

const MOCK_PREFIX = 'wire/getDecisionMatrixDetails/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic decisionMatrixDetails', async () => {
        const mock = getMock('decisionMatrixDetails');
        const config = { id: '123' };
        mockGetDecisionMatricDetailsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDecisionMatrixDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredDecisionMatrixDetails())).toEqual(mock);
    });

    it('do not fetch DecisionMatrixDetails second time', async () => {
        const mock = getMock('decisionMatrixDetails');
        const config = { id: '123' };
        mockGetDecisionMatricDetailsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDecisionMatrixDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredDecisionMatrixDetails())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetDecisionMatrixDetails);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredDecisionMatrixDetails())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { id: '123' };
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
        mockDecisionMatricDetailsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDecisionMatrixDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
