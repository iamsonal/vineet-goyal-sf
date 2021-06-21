import SearchCalculationProcedure from '../lwc/search-calculation-procedure';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockSearchCalculationProcedureNetworkOnce,
    mockSearchCalculationProcedureNetworkErrorOnce,
} from 'industries-rule-builder-test-util';
const MOCK_PREFIX = 'wire/searchCalculationProcedure/__karma__/data/';
function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}
describe('basic', () => {
    it('searches list of calculation procedures', async () => {
        const mock = getMock('calculationProcedure');
        const config = {};
        mockSearchCalculationProcedureNetworkOnce(config, mock);
        const el = await setupElement(config, SearchCalculationProcedure);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredCalculationProcedures())).toEqual(mock);
    });
    it('do not fetch CalculationProcedure second time', async () => {
        const mock = getMock('calculationProcedure');
        const config = {};
        mockSearchCalculationProcedureNetworkOnce(config, mock);
        const el = await setupElement(config, SearchCalculationProcedure);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredCalculationProcedures())).toEqual(mock);
        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, SearchCalculationProcedure);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredCalculationProcedures())).toEqual(mock);
    });
    it('searches list of calculation procedures with query params', async () => {
        const mock = getMock('calculationProcedureSearchKey');
        const config = {
            searchKey: 'calculation',
        };
        mockSearchCalculationProcedureNetworkOnce(config, mock);
        const el = await setupElement(config, SearchCalculationProcedure);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredCalculationProcedures()).toEqual(mock);
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
        mockSearchCalculationProcedureNetworkErrorOnce(config, mock);
        const el = await setupElement(config, SearchCalculationProcedure);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
