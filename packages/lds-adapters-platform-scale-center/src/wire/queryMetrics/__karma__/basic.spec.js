import Query from './lwc/query';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockExecuteQueryNetworkOnce,
    mockExecuteQueryNetworkErrorOnce,
} from 'platform-scale-center-test-util';

const MOCK_PREFIX = 'wire/queryMetrics/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

const apiParams = {
    guid: '1234',
    path: 'datasource/requestType/sample_metric',
    start: 123456789,
    end: 123456789,
};

const requestParams = {
    request: JSON.stringify(apiParams),
};

describe('success', () => {
    it('executes query and returns response data', async () => {
        // Arrange
        const mockResponse = getMock('response');
        mockExecuteQueryNetworkOnce(requestParams, mockResponse);

        // Act
        const el = await setupElement(requestParams, Query);

        // Assert
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mockResponse);
    });
});

describe('error', () => {
    it('displays error when network request 404s', async () => {
        // Arrange
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
        mockExecuteQueryNetworkErrorOnce(requestParams, mockErrorResponse);

        // Act
        const el = await setupElement(requestParams, Query);

        // Assert
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mockErrorResponse);
    });
});
