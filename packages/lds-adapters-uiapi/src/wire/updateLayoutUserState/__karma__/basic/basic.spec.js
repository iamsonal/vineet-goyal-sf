import { updateLayoutUserState } from 'lds';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    LayoutMode,
    LayoutType,
    MASTER_RECORD_TYPE_ID,
    mockGetLayoutUserStateNetwork,
    mockUpdateLayoutUserStateNetwork,
} from 'uiapi-test-util';

import GetLayoutUserState from '../lwc/get-layout-user-state';

const GET_LAYOUT_MOCK_PREFIX = 'wire/updateLayoutUserState/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(GET_LAYOUT_MOCK_PREFIX + filename);
}

const DEFAULT_CONFIG = {
    objectApiName: 'Account',
    layoutType: LayoutType.Full,
    mode: LayoutMode.View,
    recordTypeId: MASTER_RECORD_TYPE_ID,
};

describe('Update layoutUserState', () => {
    it('makes HTTP update request when layout user state not in cache', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const firstSectionUserStateId = Object.keys(mock.sectionUserStates)[0];
        const updatedMock = getMock('layoutUserState-Account-Full-View');

        updatedMock.sectionUserStates[firstSectionUserStateId].collapsed = !updatedMock
            .sectionUserStates[firstSectionUserStateId].collapsed;
        const sectionUserStateInput = {
            sectionUserStates: {
                [firstSectionUserStateId]: {
                    collapsed: updatedMock.sectionUserStates[firstSectionUserStateId].collapsed,
                },
            },
        };

        mockUpdateLayoutUserStateNetwork(DEFAULT_CONFIG, sectionUserStateInput, updatedMock);

        //Update the layout user state. This will fetch a fresh value since we don't have it in cache.
        await updateLayoutUserState(
            DEFAULT_CONFIG.objectApiName,
            DEFAULT_CONFIG.recordTypeId,
            DEFAULT_CONFIG.layoutType,
            DEFAULT_CONFIG.mode,
            sectionUserStateInput
        );

        const elm = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);
        // Verify that the adapter got the updated value.
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(updatedMock);
    });

    it('makes HTTP update request when layout user state is in cache', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const firstSectionUserStateId = Object.keys(mock.sectionUserStates)[0];
        const updatedMock = getMock('layoutUserState-Account-Full-View');
        updatedMock.sectionUserStates[firstSectionUserStateId].collapsed = !updatedMock
            .sectionUserStates[firstSectionUserStateId].collapsed;
        const sectionUserStateInput = {
            sectionUserStates: {
                [firstSectionUserStateId]: {
                    collapsed: updatedMock.sectionUserStates[firstSectionUserStateId].collapsed,
                },
            },
        };

        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, mock);

        const elm = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        mockUpdateLayoutUserStateNetwork(DEFAULT_CONFIG, sectionUserStateInput, updatedMock);

        // Update the layout user state
        await updateLayoutUserState(
            'Account',
            MASTER_RECORD_TYPE_ID,
            LayoutType.Full,
            LayoutMode.View,
            sectionUserStateInput
        );

        // Verify that the adapter got the updated value.
        expect(elm.pushCount()).toBe(2);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(updatedMock);
    });

    it('makes HTTP update request for layout user state when section state not in cache', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const firstSectionUserStateId = Object.keys(mock.sectionUserStates)[0];
        const mockMissingSection = getMock('layoutUserState-Account-Full-View');

        delete mockMissingSection.sectionUserStates[firstSectionUserStateId];

        const updatedMock = getMock('layoutUserState-Account-Full-View');

        updatedMock.sectionUserStates[firstSectionUserStateId].collapsed = !updatedMock
            .sectionUserStates[firstSectionUserStateId].collapsed;
        const sectionUserStateInput = {
            sectionUserStates: {
                [firstSectionUserStateId]: {
                    collapsed: updatedMock.sectionUserStates[firstSectionUserStateId].collapsed,
                },
            },
        };

        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, mockMissingSection);

        const elm = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mockMissingSection);

        mockUpdateLayoutUserStateNetwork(DEFAULT_CONFIG, sectionUserStateInput, updatedMock);

        // Update the layout user state
        await updateLayoutUserState(
            'Account',
            MASTER_RECORD_TYPE_ID,
            LayoutType.Full,
            LayoutMode.View,
            sectionUserStateInput
        );

        // Verify that the adapter got the updated value.
        expect(elm.pushCount()).toBe(2);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(updatedMock);
    });

    it('throws 500 with invalid input and server error', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const firstSectionUserStateId = Object.keys(mock.sectionUserStates)[0];
        const updatedMock = getMock('layoutUserState-Account-Full-View');

        const sectionUserStateInput = {
            sectionUserStates: {
                [firstSectionUserStateId]: {
                    collapsed: updatedMock.sectionUserStates[firstSectionUserStateId].collapsed,
                },
            },
        };

        const config = Object.assign({}, DEFAULT_CONFIG, {
            objectApiName: 'Invalid',
        });

        mockUpdateLayoutUserStateNetwork(config, sectionUserStateInput, { reject: true, data: {} });

        try {
            await updateLayoutUserState(
                config.objectApiName,
                config.recordTypeId,
                config.layoutType,
                config.mode,
                sectionUserStateInput
            );

            fail('failed to throw with server error');
        } catch (e) {
            expect(e).toEqual(
                jasmine.objectContaining({
                    status: 500,
                    ok: false,
                })
            );
            expect(e.statusText.toLowerCase()).toContain('server error');
        }
    });
});

describe('coercion', () => {
    it('makes HTTP update request for layout user state when objectApi name is ObjectId', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const firstSectionUserStateId = Object.keys(mock.sectionUserStates)[0];
        const firstSectionCollapsed = mock.sectionUserStates[firstSectionUserStateId].collapsed;
        const updatedMock = getMock('layoutUserState-Account-Full-View');
        updatedMock.sectionUserStates[firstSectionUserStateId].collapsed = !firstSectionCollapsed;

        const sectionUserStateInput = {
            sectionUserStates: {
                [firstSectionUserStateId]: {
                    collapsed: updatedMock.sectionUserStates[firstSectionUserStateId].collapsed,
                },
            },
        };

        const configUsingObjectId = {
            objectApiName: {
                objectApiName: 'Account',
            },
            layoutType: LayoutType.Full,
            mode: LayoutMode.View,
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };
        mockGetLayoutUserStateNetwork(configUsingObjectId, mock);

        const elm = await setupElement(configUsingObjectId, GetLayoutUserState);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        mockUpdateLayoutUserStateNetwork(configUsingObjectId, sectionUserStateInput, updatedMock);

        // Update the layout user state
        await updateLayoutUserState(
            'Account',
            MASTER_RECORD_TYPE_ID,
            LayoutType.Full,
            LayoutMode.View,
            sectionUserStateInput
        );

        // Verify that the adapter got the updated value.
        expect(elm.pushCount()).toBe(2);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(updatedMock);
    });

    it('coerces recordType and mode to default values when undefined', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const firstSectionUserStateId = Object.keys(mock.sectionUserStates)[0];
        const firstSectionCollapsed = mock.sectionUserStates[firstSectionUserStateId].collapsed;
        const updatedMock = getMock('layoutUserState-Account-Full-View');
        updatedMock.sectionUserStates[firstSectionUserStateId].collapsed = !firstSectionCollapsed;

        const sectionUserStateInput = {
            sectionUserStates: {
                [firstSectionUserStateId]: {
                    collapsed: updatedMock.sectionUserStates[firstSectionUserStateId].collapsed,
                },
            },
        };

        const config = {
            objectApiName: 'Account',
            layoutType: LayoutType.Full,
            mode: LayoutMode.View,
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };
        mockGetLayoutUserStateNetwork(config, mock);

        // updateLayoutUserState should request with Full layputType and View mode
        mockUpdateLayoutUserStateNetwork(config, sectionUserStateInput, updatedMock);

        const elm = await setupElement(config, GetLayoutUserState);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // Update the layout user state
        await updateLayoutUserState(
            'Account',
            MASTER_RECORD_TYPE_ID,
            undefined,
            undefined,
            sectionUserStateInput
        );

        // Verify that the adapter got the updated value.
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(updatedMock);
    });
});
