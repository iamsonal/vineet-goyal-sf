import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetObjectInfoNetwork } from 'uiapi-test-util';

import ObjectBasic from '../lwc/object-basic';

const MOCK_PREFIX = 'wire/getObjectInfo/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getObjectInfo - basic', () => {
    [
        { name: 'string', value: 'Account' },
        { name: 'ObjectId', value: { objectApiName: 'Account' } },
    ].forEach(testConfig => {
        it(`gets data when objectApiName is ${testConfig.name}`, async () => {
            const mockData = getMock('object-Account');
            const resourceConfig = { objectApiName: mockData.apiName };
            mockGetObjectInfoNetwork(resourceConfig, mockData);

            const props = { objectApiName: testConfig.value };
            const element = await setupElement(props, ObjectBasic);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        });
    });
});
