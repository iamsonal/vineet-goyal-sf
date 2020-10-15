import { getMock as globalGetMock } from 'test-util';

const MOCK_PREFIX = 'wire/getRecords/__karma__/api-limit/data/';

function getMock(fileName) {
    return globalGetMock(MOCK_PREFIX + fileName);
}

const ERROR_CODE_431 = 'ERROR_HTTP_431';
const ERROR_MESSAGE_431 = 'Request Header Fields Too Large';

const verifyError = mock => {
    expect(mock.errorCode).toEqual(ERROR_CODE_431);
    expect(mock.message).toContain(ERROR_MESSAGE_431);
};

describe('getRecords limits', () => {
    it('record account API limit', () => {
        const mock = getMock('accounts-limit');
        verifyError(mock[0]);
    });

    it('custom sOjbect API limit', () => {
        const mock = getMock('customObject-limit');
        verifyError(mock[0]);
    });
});
