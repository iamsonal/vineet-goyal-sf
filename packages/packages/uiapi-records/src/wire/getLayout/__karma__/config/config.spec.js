import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    LayoutType,
    LayoutMode,
    MASTER_RECORD_TYPE_ID,
    mockGetLayoutNetwork,
} from 'uiapi-test-util';

import GetLayout from '../lwc/get-layout';

const MOCK_PREFIX = 'wire/getLayout/__karma__/config/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('validation', () => {
    ['objectApiName', 'layoutType', 'mode'].forEach(param => {
        it(`should not make an HTTP request if required param ${param} is undefined`, async () => {
            const config = {
                objectApiName: 'Account',
                layoutType: LayoutType.Full,
                mode: LayoutMode.View,
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = undefined;

            const elm = await setupElement(config, GetLayout);
            expect(elm.pushCount()).toBe(0);
        });
    });

    ['objectApiName', 'layoutType', 'mode'].forEach(param => {
        it(`should not make an HTTP request if required param '${param}' is null`, async () => {
            const config = {
                objectApiName: 'Account',
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = null;

            const elm = await setupElement(config, GetLayout);
            expect(elm.pushCount()).toBe(0);
        });
    });

    ['layoutType', 'mode'].forEach(param => {
        it(`should not make an HTTP request if '${param}' is invalid value`, async () => {
            const config = {
                objectApiName: 'Account',
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = 'invalid';

            const elm = await setupElement(config, GetLayout);
            expect(elm.pushCount()).toBe(0);
        });
    });

    ['layoutType', 'mode'].forEach(param => {
        it(`should not make an HTTP request if '${param}' is empty string`, async () => {
            const config = {
                objectApiName: 'Account',
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = '';

            const elm = await setupElement(config, GetLayout);
            expect(elm.pushCount()).toBe(0);
        });
    });
});

describe('recordTypeId', () => {
    it('requests with master recordTypeId if recordTypeId is null', async () => {
        const mock = getMock('layout-Account');

        const config = {
            objectApiName: 'Account',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: null,
        };

        const networkParams = {
            ...config,
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };
        mockGetLayoutNetwork(networkParams, mock);

        const elm = await setupElement(config, GetLayout);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});

describe('objectApiName', () => {
    it('requests with objectApiName when objectApiName is an ObjectId', async () => {
        const mock = getMock('layout-Account');

        const config = {
            objectApiName: {
                objectApiName: 'Account',
            },
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        const networkParams = {
            ...config,
            objectApiName: 'Account',
        };
        mockGetLayoutNetwork(networkParams, mock);

        const element = await setupElement(config, GetLayout);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
