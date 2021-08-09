import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordTemplateCreateNetwork } from 'uiapi-test-util';

import GetRecordTemplateCreate from '../lwc/get-record-template-create';

const MOCK_PREFIX = 'wire/getRecordTemplateCreate/__karma__/error/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getRecordTemplateCreate errors', () => {
    it('should propagate error when server returns 403 for bad objectApiName', async () => {
        const errorMock = getMock('record-template-create-objectApiNameInvalid');

        const config = {
            objectApiName: 'Foo',
        };

        mockGetRecordTemplateCreateNetwork(config, { reject: true, data: { body: errorMock } });

        const elm = await setupElement(config, GetRecordTemplateCreate);

        expect(elm.getWiredError()).toContainErrorBody(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });

    it('should propagate error when server returns 400 for invalid recordTypeId value', async () => {
        const errorMock = getMock('record-template-create-recordTypeIdInvalid');

        const config = {
            objectApiName: 'Account',
            recordTypeId: '001RM000004PkciYAC',
        };

        mockGetRecordTemplateCreateNetwork(config, { reject: true, data: { body: errorMock } });

        const elm = await setupElement(config, GetRecordTemplateCreate);

        expect(elm.getWiredError()).toContainErrorBody(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });

    it('should propagate error when server returns 400 for invalid optionalField value', async () => {
        const errorMock = getMock('record-template-create-optionalFieldsInvalid');

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Name'],
        };

        mockGetRecordTemplateCreateNetwork(config, { reject: true, data: { body: errorMock } });

        const elm = await setupElement(config, GetRecordTemplateCreate);

        expect(elm.getWiredError()).toContainErrorBody(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });
});
