import GetExplainabilityActionLogs from '../lwc/get-explainability-action-logs';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockExplainabilityActionLogsNetworkOnce,
    mockExplainabilityActionLogsNetworkErrorOnce,
} from 'industries-explainability-test-util';
const MOCK_PREFIX = 'wire/getExplainabilityActionLogs/__karma__/data/';
function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}
describe('basic', () => {
    it('get list of explainability action logs', async () => {
        const mock = getMock('explainabilityActionLogs');
        const mockConfig = getMock('explainabilityActionLogConfig');
        const config = {
            actionContextCode: mockConfig.actionContextCode,
            applicationType: mockConfig.applicationType,
            applicationSubType: mockConfig.applicationSubType,
        };
        mockExplainabilityActionLogsNetworkOnce(config, mock);
        const el = await setupElement(config, GetExplainabilityActionLogs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredExplainabilityActionLogs()).toEqual(mock);
    });
    it('do not fetch explainability action logs second time', async () => {
        const mock = getMock('explainabilityActionLogs');
        const mockConfig = getMock('explainabilityActionLogConfig');
        const config = {
            actionContextCode: mockConfig.actionContextCode,
            applicationType: mockConfig.applicationType,
            applicationSubType: mockConfig.applicationSubType,
        };
        mockExplainabilityActionLogsNetworkOnce(config, mock);
        const el = await setupElement(config, GetExplainabilityActionLogs);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredExplainabilityActionLogs()).toEqual(mock);
        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetExplainabilityActionLogs);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredExplainabilityActionLogs()).toEqual(mock);
    });
    it('displays error when network request 404s', async () => {
        const config = {};
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
        mockExplainabilityActionLogsNetworkErrorOnce(config, mock);
        const el = await setupElement(config, GetExplainabilityActionLogs);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
