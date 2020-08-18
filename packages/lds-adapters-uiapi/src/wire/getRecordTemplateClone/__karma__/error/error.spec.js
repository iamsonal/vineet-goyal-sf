import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetRecordTemplateCloneNetwork,
    expireCloneTemplateRepresentation,
} from 'uiapi-test-util';

import GetRecordTemplateClone from '../lwc/get-record-template-clone';

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
            recordId: '001RM000004PkciYAC', // invalid
        };

        mockGetRecordTemplateCloneNetwork(config, { reject: true, data: errorMock });

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });

    it('should cache 404 not found error for bad recordId', async () => {
        const errorMock = getMock('record-template-clone-recordIdInvalid');

        const config = {
            recordId: '001RM000004PkciYAC', // invalid
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
        const validMock = getMock('record-template-clone-Account');
        const recordId = validMock.record.fields.CloneSourceId.value;

        const config = {
            recordId, // 1st time: invalid, 2nd time: valid
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
        const errorMock = getMock('record-template-clone-recordTypeIdInvalid');

        const config = {
            recordId: '001RM000004PkciYAC',
            recordTypeId: '001RM000004PkciYAC', // invalid
        };

        mockGetRecordTemplateCloneNetwork(config, { reject: true, data: errorMock });

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });

    it('should propagate error when server returns 400 for invalid optionalField value', async () => {
        const errorMock = getMock('record-template-clone-optionalFieldsInvalid');

        const config = {
            recordId: '001RM000004PkciYAC',
            optionalFields: ['Name'], // invalid
        };

        mockGetRecordTemplateCloneNetwork(config, { reject: true, data: errorMock });

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.getWiredError()).toContainErrorResponse(errorMock);
        expect(elm.getWiredError()).toBeImmutable();
    });
});
