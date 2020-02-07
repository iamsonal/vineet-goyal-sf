import ListContent from '../lwc/list-content';
import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockListContentNetwork } from 'cms-delivery-test-util';

const MOCK_PREFIX = 'wire/listContent/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets some content', async () => {
        const mock = getMock('list-content');
        const config = { channelId: 'ABC123' };

        mockListContentNetwork(config, mock);

        const el = await setupElement(config, ListContent);
        expect(el.pushCount).toBe(1);
        expect(el.items[0].title).toBe(mock.items[0].title);
    });

    it('includes metadata when returned', async () => {
        const mock = getMock('list-content-include-metadata');
        const config = { channelId: 'ABC123', includeMetadata: true };

        mockListContentNetwork(config, mock);

        const el = await setupElement(config, ListContent);
        expect(el.pushCount).toBe(1);
        expect(el.managedContentTypes).toEqual(mock.managedContentTypes);
    });
});
