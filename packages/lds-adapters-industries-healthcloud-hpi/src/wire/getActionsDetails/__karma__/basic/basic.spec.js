import GetActionsDetails from '../lwc/getactionsdetails';
import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetMorePatientScoresNetworkOnce } from 'industries-healthcloud-hpi-test-util';
import { mockGetMorePatientScoresErrorNetworkOnce } from '../../../../../karma/industries-healthcloud-hpi-test-util';

const MOCK_PREFIX = 'wire/getActionsDetails/__karma__/data/';

const queryParams = {
    actions: [],
    formFactor: 'LARGE',
    recordId: '001x',
};
function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('get operation path', async () => {
        const mock = getMock('getActionsDetails');
        const config = queryParams;
        mockGetMorePatientScoresNetworkOnce(config, mock);

        const el = await setupElement(config, GetActionsDetails);
        expect(el.getWiredResponse()).toEqual(mock);
    });

    it('get operation with n/w err', async () => {
        const config = queryParams;
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
        mockGetMorePatientScoresErrorNetworkOnce(config, mock);

        const el = await setupElement(config, GetActionsDetails);

        expect(el.getError()).toEqual(mock);
    });

    it('get operation when config is an empty object', async () => {
        const mock = {
            hpiActionsOutputRepresentationElements: [],
        };
        const config = {};
        mockGetMorePatientScoresNetworkOnce(config, mock);

        const el = await setupElement(config, GetActionsDetails);
        expect(el.getWiredResponse()).toEqual(mock);
    });
});
