import { getMock as globalGetMock, flushPromises } from 'test-util';
import { expireDuplicatesRepresentation, mockGetDuplicatesNetwork } from 'uiapi-test-util';

import GetDuplicates from '../lwcReactive/get-duplicates';
import { createElement } from 'lwc';

const MOCK_PREFIX = 'wire/getDuplicates/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('get duplicates reactive', () => {
    it('should receive data when input changes (reactivity)', async () => {
        const mock = getMock('duplicates-Lead');
        const config = {
            apiName: 'Lead',
            fields: {
                FirstName: 'Jim',
                LastName: 'Steele',
                Email: 'info@salesforce.com',
            },
        };
        mockGetDuplicatesNetwork(config, [mock, mock]);
        const element = createElement('x-foo', { is: GetDuplicates });

        element.fields = config.fields;
        document.body.appendChild(element);

        await flushPromises();

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireDuplicatesRepresentation();

        element.fields = config.fields;
        await flushPromises();

        // wire should receive value
        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
