import GetDeliveryChannels from '../lwc/get-delivery-channels';
import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetDeliveryChannelsNetwork } from 'cms-delivery-test-util';

const MOCK_PREFIX = 'wire/getDeliveryChannels/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets the delivery channels', async () => {
        const mock = getMock('channels');
        const config = { page: 0, pageSize: 10 };

        mockGetDeliveryChannelsNetwork(config, mock);

        const el = await setupElement(config, GetDeliveryChannels);
        expect(el.pushCount()).toBe(1);
        expect(el.channels).toEqual(mock.channels);
    });
});
