import GetMorePatientScores from '../lwc/getMorePatientScores';
import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetScoresNetworkOnce } from 'industries-healthcloud-hpi-test-util';
import { mockGetScoresErrorNetworkOnce } from '../../../../../karma/industries-healthcloud-hpi-test-util';

const MOCK_PREFIX = 'wire/getMorePatientScores/__karma__/data/';

const queryParams = {
    scoreId: '0gzxx000000001dAAA',
    limitBy: '80',
    searchTerm: 'searchTerm',
    recordType: 'type',
    startIndex: '0',
    range: '15',
};
function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('get operation path for the score api', async () => {
        const mock = getMock('getMorePatientScores');
        const config = queryParams;
        mockGetScoresNetworkOnce(config, mock);

        const el = await setupElement(config, GetMorePatientScores);
        expect(el.getWiredResponse()).toEqual(mock);
    });

    it('get operation with n/w err for the score api', async () => {
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
        mockGetScoresErrorNetworkOnce(config, mock);

        const el = await setupElement(config, GetMorePatientScores);

        expect(el.getError()).toEqual(mock);
    });

    it('get operation when config is an blank query params for the score api', async () => {
        const mock = {
            scoreDetails: [],
            scoreId: '0gzxx000000001dAAA',
            limitBy: '',
            searchTerm: '',
            recordType: '',
            startIndex: '',
            range: '',
        };

        const config = {
            scoreId: '0gzxx000000001dAAA',
        };
        mockGetScoresNetworkOnce(config, mock);
        const el = await setupElement(config, GetMorePatientScores);
        expect(el.getWiredResponse()).toEqual(mock);
    });
});
