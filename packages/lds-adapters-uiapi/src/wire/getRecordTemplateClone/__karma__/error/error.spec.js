import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetRecordTemplateCloneNetwork,
    expireCloneTemplateRepresentation,
} from 'uiapi-test-util';

import GetRecordTemplateClone from '../lwc/get-record-template-clone';

const recordIdGlobal = '001RM000004PkciYAC';

// use mocks from getRecordTemplateCreate
const CREATE_MOCK_ERROR_PREFIX = 'wire/getRecordTemplateCreate/__karma__/error/data/';
const CREATE_MOCK_BASIC_PREFIX = 'wire/getRecordTemplateCreate/__karma__/basic/data/';

function getCreateTemplateMock(filename) {
    const mock = globalGetMock(CREATE_MOCK_ERROR_PREFIX + filename);
    return mock;
}

function getCreateTemplateMockWithSrcId(filename, recordId) {
    const mock = globalGetMock(CREATE_MOCK_BASIC_PREFIX + filename);
    mock.record.fields.CloneSourceId = {
        displayValue: null,
        value: recordId ? recordId : recordIdGlobal,
    };
    return mock;
}

// Clone Mock
const MOCK_PREFIX = 'wire/getRecordTemplateClone/__karma__/error/data/';
function getMock(filename) {
    const mock = globalGetMock(MOCK_PREFIX + filename);
    return mock;
}

describe('getRecordTemplateClone errors', () => {
    it('should propagate error when server returns 404 for bad recordId', async () => {
        const errorMock = getMock('record-template-clone-recordIdInvalid');

        const config = {
            recordId: recordIdGlobal, // invalid
        };

        mockGetRecordTemplateCloneNetwork(config, { reject: true, data: errorMock });

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });

    it('should cache 404 not found error for bad recordId', async () => {
        const errorMock = getMock('record-template-clone-recordIdInvalid');

        const config = {
            recordId: recordIdGlobal, // invalid
        };

        mockGetRecordTemplateCloneNetwork(config, {
            reject: true,
            status: 404,
            statusText: 'Not Found',
            ok: false,
            data: errorMock,
        });

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm.getWiredError()).toBeImmutable();

        const elm2 = await setupElement(config, GetRecordTemplateClone);

        expect(elm2.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm2.getWiredError()).toBeImmutable();
    });

    it('should refetch recordTemplateClone when ingested template error TTLs out', async () => {
        const errorMock = getMock('record-template-clone-recordIdInvalid');
        const validMock = getCreateTemplateMockWithSrcId('record-template-create-Account');

        const config = {
            recordId: recordIdGlobal, // 1st time: invalid, 2nd time: valid
        };

        mockGetRecordTemplateCloneNetwork(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: errorMock,
            },
            validMock,
        ]);

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm.getWiredError()).toBeImmutable();

        expireCloneTemplateRepresentation();

        const elm2 = await setupElement(config, GetRecordTemplateClone);
        expect(elm2.getWiredData()).toEqualSnapshotWithoutEtags(validMock);
    });

    it('should propagate error when server returns 400 for invalid recordTypeId value', async () => {
        const errorMock = getCreateTemplateMock('record-template-create-recordTypeIdInvalid');

        const config = {
            recordId: recordIdGlobal,
            recordTypeId: '001RM000004PkciYAC', // invalid
        };

        mockGetRecordTemplateCloneNetwork(config, { reject: true, data: errorMock });

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });

    it('should propagate error when server returns 400 for invalid optionalField value', async () => {
        const errorMock = getCreateTemplateMock('record-template-create-optionalFieldsInvalid');

        const config = {
            recordId: recordIdGlobal,
            optionalFields: ['Name'], // invalid
        };

        mockGetRecordTemplateCloneNetwork(config, { reject: true, data: errorMock });

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });
});
