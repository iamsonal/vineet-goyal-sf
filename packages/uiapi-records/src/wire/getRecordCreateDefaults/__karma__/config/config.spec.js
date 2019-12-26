import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    FormFactor,
    MASTER_RECORD_TYPE_ID,
    mockGetRecordCreateDefaultsNetwork,
} from 'uiapi-test-util';

import GetRecordCreateDefaults from '../lwc/get-record-create-defaults';

const MOCK_PREFIX = 'wire/getRecordCreateDefaults/__karma__/config/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('objectApiName', () => {
    [undefined, null].forEach(value => {
        it(`should not make a network request if required param objectApiName is '${value}'`, async () => {
            const config = {
                objectApiName: value,
            };

            const elm = await setupElement(config, GetRecordCreateDefaults);
            expect(elm.pushCount()).toBe(0);
        });
    });

    it('should make correct HTTP request for ObjectId objectApiName', async () => {
        const mock = getMock('record-defaults-create-Account');

        const config = {
            objectApiName: {
                objectApiName: 'Account',
            },
        };

        mockGetRecordCreateDefaultsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordCreateDefaults);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});

describe('formFactor', () => {
    it('requests with large formFactor value if formFactor is undefined', async () => {
        const mock = getMock('record-defaults-create-Account');

        const config = {
            objectApiName: 'Account',
            formFactor: undefined,
        };

        const networkParams = {
            ...config,
            formFactor: FormFactor.Large,
        };
        mockGetRecordCreateDefaultsNetwork(networkParams, mock);

        const elm = await setupElement(config, GetRecordCreateDefaults);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    [
        { type: 'null', formFactor: null },
        { type: 'an invalid value', formFactor: 'invalid' },
    ].forEach(({ type, formFactor }) => {
        it(`treats config as incomplete if formFactor is ${type}`, async () => {
            const config = {
                objectApiName: 'Account',
                formFactor,
            };

            const elm = await setupElement(config, GetRecordCreateDefaults);

            expect(elm.pushCount()).toBe(0);
        });
    });
});

describe('recordTypeId', () => {
    [undefined, null].forEach(value => {
        it(`requests with master recordTypeId if recordTypeId is ${value}`, async () => {
            const mock = getMock('record-defaults-create-Account');

            const networkParams = {
                objectApiName: 'Account',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            mockGetRecordCreateDefaultsNetwork(networkParams, mock);

            const config = {
                objectApiName: 'Account',
                recordTypeId: value,
            };
            const elm = await setupElement(config, GetRecordCreateDefaults);
            expect(elm.pushCount()).toBe(1);
            expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
        });
    });
});

describe('optionalFields', () => {
    [undefined, null].forEach(value => {
        it(`requests with empty array if optionalFields is ${value}`, async () => {
            const mock = getMock('record-defaults-create-Account');

            const config = {
                objectApiName: 'Account',
                optionalFields: value,
            };

            const networkParams = {
                ...config,
                optionalFields: [],
            };
            mockGetRecordCreateDefaultsNetwork(networkParams, mock);

            const elm = await setupElement(config, GetRecordCreateDefaults);
            expect(elm.pushCount()).toBe(1);
            expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
        });
    });

    it('coerces string type optionalFields to array', async () => {
        const mock = getMock('record-defaults-create-Account');

        const config = {
            objectApiName: 'Account',
            optionalFields: 'Account.Id',
        };

        const networkParams = {
            ...config,
            optionalFields: ['Account.Id'],
        };
        mockGetRecordCreateDefaultsNetwork(networkParams, mock);

        const elm = await setupElement(config, GetRecordCreateDefaults);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
