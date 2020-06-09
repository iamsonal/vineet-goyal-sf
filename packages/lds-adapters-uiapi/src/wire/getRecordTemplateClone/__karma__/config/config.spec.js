import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordTemplateCloneNetwork } from 'uiapi-test-util';

import GetRecordTemplateClone from '../lwc/get-record-template-clone';

const MOCK_PREFIX = 'wire/getRecordTemplateClone/__karma__/config/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('recordId', () => {
    [undefined, null].forEach(value => {
        it(`should not make a network request if required param recordId is '${value}'`, async () => {
            const config = {
                recordId: value,
            };

            const elm = await setupElement(config, GetRecordTemplateClone);
            expect(elm.pushCount()).toBe(0);
        });
    });

    it('should make correct HTTP request for valid recordId', async () => {
        const mock = getMock('record-template-clone-Account');

        const config = {
            recordId: '001RM000004PkciYAC',
        };

        const network = {
            recordId: '001RM000004PkciYAC',
            recordTypeId: undefined,
        };

        mockGetRecordTemplateCloneNetwork(network, mock);

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});

describe('recordTypeId', () => {
    [undefined, null].forEach(value => {
        it(`requests with undefined if recordTypeId is ${value}`, async () => {
            const mock = getMock('record-template-clone-Account');

            const networkParams = {
                recordId: '001RM000004PkciYAC',
                recordTypeId: undefined,
            };
            mockGetRecordTemplateCloneNetwork(networkParams, mock);

            const config = {
                recordId: '001RM000004PkciYAC',
                recordTypeId: value,
            };
            const elm = await setupElement(config, GetRecordTemplateClone);
            expect(elm.pushCount()).toBe(1);
            expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
        });
    });

    it('should make correct HTTP request for valid recordTypeId', async () => {
        const mock = getMock('record-template-clone-Account');
        mock.record.recordTypeId = '012RM00000025SOYAY';

        const config = {
            recordId: '001RM000004PkciYAC',
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCloneNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not error if recordType is null in response', async () => {
        const mock = getMock('record-template-clone-Account');
        mock.record.recordTypeId = null;

        const config = {
            recordId: '001RM000004PkciYAC',
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCloneNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});

describe('optionalFields', () => {
    [undefined, null].forEach(value => {
        it(`requests with undefined if optionalFields is ${value}`, async () => {
            const mock = getMock('record-template-clone-Account');

            const config = {
                recordId: '001RM000004PkciYAC',
                optionalFields: value,
            };

            const networkParams = {
                ...config,
                optionalFields: undefined,
            };
            mockGetRecordTemplateCloneNetwork(networkParams, mock);

            const elm = await setupElement(config, GetRecordTemplateClone);
            expect(elm.pushCount()).toBe(1);
            expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
        });
    });

    it('should make correct HTTP request for valid optionalFields', async () => {
        const mock = getMock('record-template-clone-Account-optionalFields-Name');

        const config = {
            recordId: '001RM000004PkciYAC',
            recordTypeId: '012RM00000025SOYAY',
            optionalFields: ['Account.Name'],
        };

        mockGetRecordTemplateCloneNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateClone);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('coerces string type optionalFields to array', async () => {
        const mock = getMock('record-template-clone-Account-optionalFields-Name');

        const config = {
            recordId: '001RM000004PkciYAC',
            recordTypeId: '012RM00000025SOYAY',
            optionalFields: 'Account.Name',
        };

        const networkParams = {
            ...config,
            optionalFields: ['Account.Name'],
        };
        mockGetRecordTemplateCloneNetwork(networkParams, mock);

        const elm = await setupElement(config, GetRecordTemplateClone);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
