import GetSimulationInputVariables from '../lwc/get-simulation-input-variables';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetSimulationInputVariablesNetworkOnce,
    mockSimulationInputVariablesNetworkErrorOnce,
} from 'industries-rule-builder-test-util';

const MOCK_PREFIX = 'wire/getSimulationInputVariables/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic simulationInputVariables', async () => {
        const mock = getMock('simulationInputVariables');
        const wireconfig = {
            id: '123',
            inputVariables: true,
        };
        mockGetSimulationInputVariablesNetworkOnce(wireconfig, mock);

        const el = await setupElement(wireconfig, GetSimulationInputVariables);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredSimulationInputVariables())).toEqual(mock);
    });

    it('do not fetch simulationInputVariables second time', async () => {
        const mock = getMock('simulationInputVariables');
        const config = {
            id: '123',
            inputVariables: true,
        };
        mockGetSimulationInputVariablesNetworkOnce(config, mock);

        const el = await setupElement(config, GetSimulationInputVariables);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredSimulationInputVariables())).toEqual(mock);
        const el2 = await setupElement(config, GetSimulationInputVariables);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredSimulationInputVariables())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            id: '123',
            inputVariables: true,
        };
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
        mockSimulationInputVariablesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetSimulationInputVariables);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
