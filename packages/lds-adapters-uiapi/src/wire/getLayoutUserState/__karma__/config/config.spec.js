import {
    LayoutMode,
    LayoutType,
    MASTER_RECORD_TYPE_ID,
    mockGetLayoutUserStateNetwork,
} from 'uiapi-test-util';
import { getMock as globalGetMock, setupElement } from 'test-util';

import GetLayoutUserState from '../lwc/get-layout-user-state';

const MOCK_PREFIX = 'wire/getLayoutUserState/__karma__/config/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('validation', () => {
    ['objectApiName', 'recordTypeId'].forEach((param) => {
        it(`should not make a network request if required param '${param}' is undefined`, async () => {
            const config = {
                objectApiName: 'Account',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = undefined;

            const elm = await setupElement(config, GetLayoutUserState);
            expect(elm.pushCount()).toBe(0);
        });
    });

    ['objectApiName', 'recordTypeId'].forEach((param) => {
        it(`should not make a network request if required param ${param} is null`, async () => {
            const config = {
                objectApiName: 'Account',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };
            config[param] = null;

            const elm = await setupElement(config, GetLayoutUserState);
            expect(elm.pushCount()).toBe(0);
        });
    });
});

describe('coercion', () => {
    it('requests from network when objectApiName is an ObjectId', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const config = {
            objectApiName: {
                objectApiName: 'Account',
            },
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        const networkParams = {
            ...config,
            objectApiName: 'Account',
        };
        mockGetLayoutUserStateNetwork(networkParams, mock);

        const elm = await setupElement(config, GetLayoutUserState);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it(`requests with default value if optional param 'layoutType' and 'mode' are undefined`, async () => {
        const mock = getMock('layoutUserState-Account-Full-View');

        const config = {
            recordTypeId: MASTER_RECORD_TYPE_ID,
            objectApiName: 'Account',
            layoutType: undefined,
            mode: undefined,
        };

        const networkParams = {
            ...config,
            layoutType: LayoutType.Full,
            mode: LayoutMode.View,
        };
        mockGetLayoutUserStateNetwork(networkParams, mock);

        const element = await setupElement(config, GetLayoutUserState);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
