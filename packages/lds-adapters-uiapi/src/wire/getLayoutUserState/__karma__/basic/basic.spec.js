import {
    LayoutType,
    LayoutMode,
    MASTER_RECORD_TYPE_ID,
    expireLayoutUserState,
    mockGetLayoutUserStateNetwork,
} from 'uiapi-test-util';
import { getMock as globalGetMock, setupElement } from 'test-util';

import GetLayoutUserState from '../lwc/get-layout-user-state';

const MOCK_PREFIX = 'wire/getLayoutUserState/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

const DEFAULT_CONFIG = {
    objectApiName: 'Account',
    layoutType: LayoutType.Full,
    mode: LayoutMode.View,
    recordTypeId: MASTER_RECORD_TYPE_ID,
};

describe('getLayoutUserState', () => {
    it('should correctly make HTTP request for objectApiName, layoutType, mode, and recordTypeId', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');

        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, mock);

        const elm = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not hit network if layout is available locally', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, mock);

        const wireA = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should hit network if layout is available but expired', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');

        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, [mock, mock]);

        const wireA = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireLayoutUserState();

        const wireB = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should emit new value when value is changed', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const changed = getMock('layoutUserState-Account-Full-View');
        changed.sectionUserStates[Object.keys(changed.sectionUserStates)[0]].collapsed = true;

        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, [mock, changed]);

        const wireA = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireLayoutUserState();

        const wireB = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(changed);

        // wireA should have received new value
        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(changed);
    });

    it('should be a cache miss if two components request same objectApiName, recordTypeId and mode with different layoutType', async () => {
        const compactMock = getMock('layoutUserState-Account-Compact-View');
        const fullMock = getMock('layoutUserState-Account-Full-View');
        const compactConfig = Object.assign({}, DEFAULT_CONFIG, {
            layoutType: 'Compact',
        });

        mockGetLayoutUserStateNetwork(compactConfig, compactMock);
        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, fullMock);

        const compact = await setupElement(compactConfig, GetLayoutUserState);

        expect(compact.pushCount()).toBe(1);
        expect(compact.getWiredData()).toEqualSnapshotWithoutEtags(compactMock);

        const full = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(full.pushCount()).toBe(1);
        expect(full.getWiredData()).toEqualSnapshotWithoutEtags(fullMock);

        // Each should have received 1 push
        expect(compact.pushCount()).toBe(1);
        expect(full.pushCount()).toBe(1);
    });

    it('should be a cache miss if two components request same objectApiName, recordTypeId and layoutType with different mode', async () => {
        const fullViewMock = getMock('layoutUserState-Account-Full-View');
        const fullEditMock = getMock('layoutUserState-Account-Full-Edit');

        const fullEditConfig = Object.assign({}, DEFAULT_CONFIG, {
            mode: 'Edit',
        });

        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, fullViewMock);
        mockGetLayoutUserStateNetwork(fullEditConfig, fullEditMock);

        const fullView = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(fullView.pushCount()).toBe(1);
        expect(fullView.getWiredData()).toEqualSnapshotWithoutEtags(fullViewMock);

        const fullEdit = await setupElement(fullEditConfig, GetLayoutUserState);

        expect(fullEdit.pushCount()).toBe(1);
        expect(fullEdit.getWiredData()).toEqualSnapshotWithoutEtags(fullEditMock);

        // Each should have received 1 push
        expect(fullView.pushCount()).toBe(1);
        expect(fullEdit.pushCount()).toBe(1);
    });

    it('should be a cache miss if two components request same recordTypeId, layoutType, mode with different objectApiName', async () => {
        const accountMock = getMock('layoutUserState-Account-Full-View');
        const opportunityMock = getMock('layoutUserState-Opportunity-Full-View');

        const opportunityConfig = Object.assign({}, DEFAULT_CONFIG, {
            objectApiName: 'Opportunity',
        });

        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, accountMock);
        mockGetLayoutUserStateNetwork(opportunityConfig, opportunityMock);

        const accountFullView = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(accountFullView.pushCount()).toBe(1);
        expect(accountFullView.getWiredData()).toEqualSnapshotWithoutEtags(accountMock);

        const opportunityFullView = await setupElement(opportunityConfig, GetLayoutUserState);

        expect(opportunityFullView.pushCount()).toBe(1);
        expect(opportunityFullView.getWiredData()).toEqualSnapshotWithoutEtags(opportunityMock);

        // Each should have received 1 push
        expect(accountFullView.pushCount()).toBe(1);
        expect(opportunityFullView.pushCount()).toBe(1);
    });

    it('refresh should refresh layout user state', async () => {
        const mock = getMock('layoutUserState-Account-Full-View');
        const refreshed = getMock('layoutUserState-Account-Full-View');
        refreshed.sectionUserStates[
            Object.keys(refreshed.sectionUserStates)[0]
        ].collapsed = !refreshed.sectionUserStates[Object.keys(refreshed.sectionUserStates)[0]]
            .collapsed;

        mockGetLayoutUserStateNetwork(DEFAULT_CONFIG, [mock, refreshed]);

        const element = await setupElement(DEFAULT_CONFIG, GetLayoutUserState);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });
});
