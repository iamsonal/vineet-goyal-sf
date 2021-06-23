import GetForm from '../lwc/get-form';
import { getMock as globalGetMock, setupElement } from 'test-util';
import { clone, mockGetFormNetworkOnce } from 'experience-marketing-integration-test-util';

const MOCK_PREFIX = 'wire/getForm/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets form', async () => {
        const mock = getMock('form');
        const config = {
            formId: 'test_form_id',
            siteId: '0DM000000000000000',
        };
        mockGetFormNetworkOnce(config, mock);

        const el = await setupElement(config, GetForm);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredForm())).toEqual(mock);
    });
});
