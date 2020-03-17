import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireLayout, mockGetLayoutNetwork } from 'uiapi-test-util';

import GetLayout from '../lwc/get-layout';

const MOCK_PREFIX = 'wire/getLayout/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getLayout', () => {
    it('should correctly make HTTP request for objectApiName, layoutType and mode', async () => {
        const recordMock = getMock('record-Opportunity');
        const mock = getMock('layout-Opportunity-Compact-Edit');

        const config = {
            objectApiName: 'Opportunity',
            layoutType: 'Compact',
            mode: 'Edit',
            recordTypeId: recordMock.recordTypeId,
        };

        mockGetLayoutNetwork(config, mock);

        const elm = await setupElement(config, GetLayout);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not hit network if layout is available locally', async () => {
        const recordMock = getMock('record-Opportunity');
        const mock = getMock('layout-Opportunity-Full');

        const config = {
            objectApiName: 'Opportunity',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: recordMock.recordTypeId,
        };

        mockGetLayoutNetwork(config, mock);

        const wireA = await setupElement(config, GetLayout);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetLayout);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should hit network if layout is available but expired', async () => {
        const recordMock = getMock('record-Opportunity');
        const mock = getMock('layout-Opportunity-Full');

        const config = {
            objectApiName: 'Opportunity',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: recordMock.recordTypeId,
        };

        mockGetLayoutNetwork(config, [mock, mock]);

        const wireA = await setupElement(config, GetLayout);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireLayout();

        const wireB = await setupElement(config, GetLayout);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should emit new value when eTag changes', async () => {
        const recordMock = getMock('record-Opportunity');
        const mock = getMock('layout-Opportunity-Full');
        const changed = getMock('layout-Opportunity-Full');
        changed.eTag = 'changed';
        changed.sections[0].collapsible = true;

        const config = {
            objectApiName: 'Opportunity',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: recordMock.recordTypeId,
        };

        mockGetLayoutNetwork(config, [mock, changed]);

        const wireA = await setupElement(config, GetLayout);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireLayout();

        const wireB = await setupElement(config, GetLayout);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(changed);

        // wireA should have received new value
        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(changed);
    });

    it('should not emit new value when eTag is not changed', async () => {
        const recordMock = getMock('record-Opportunity');
        const mock = getMock('layout-Opportunity-Full');
        const changed = getMock('layout-Opportunity-Full');
        changed.sections[0].collapsible = true;

        const config = {
            objectApiName: 'Opportunity',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: recordMock.recordTypeId,
        };

        mockGetLayoutNetwork(config, [mock, changed]);

        const wireA = await setupElement(config, GetLayout);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireLayout();

        const wireB = await setupElement(config, GetLayout);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should be a cache miss if two components request same objectApiName, recordTypeId and mode with different layoutType', async () => {
        const recordMock = getMock('record-Opportunity');
        const compactMock = getMock('layout-Opportunity-Compact');
        const fullMock = getMock('layout-Opportunity-Full');

        const compactConfig = {
            objectApiName: {
                objectApiName: 'Opportunity',
            },
            layoutType: 'Compact',
            mode: 'View',
            recordTypeId: recordMock.recordTypeId,
        };
        const fullConfig = Object.assign({}, compactConfig, { layoutType: 'Full' });

        mockGetLayoutNetwork(compactConfig, compactMock);
        mockGetLayoutNetwork(fullConfig, fullMock);

        const compact = await setupElement(compactConfig, GetLayout);

        expect(compact.pushCount()).toBe(1);
        expect(compact.getWiredData()).toEqualSnapshotWithoutEtags(compactMock);

        const full = await setupElement(fullConfig, GetLayout);

        expect(full.pushCount()).toBe(1);
        expect(full.getWiredData()).toEqualSnapshotWithoutEtags(fullMock);

        // Each should have received 1 push
        expect(compact.pushCount()).toBe(1);
        expect(full.pushCount()).toBe(1);
    });

    it('should be a cache miss if two components request same objectApiName, recordTypeId and layoutType with different mode', async () => {
        const recordMock = getMock('record-Opportunity');
        const compactViewMock = getMock('layout-Opportunity-Compact');
        const compactEditMock = getMock('layout-Opportunity-Compact-Edit');

        const compactViewConfig = {
            objectApiName: {
                objectApiName: 'Opportunity',
            },
            layoutType: 'Compact',
            mode: 'View',
            recordTypeId: recordMock.recordTypeId,
        };
        const compactEditConfig = Object.assign({}, compactViewConfig, { mode: 'Edit' });

        mockGetLayoutNetwork(compactViewConfig, compactViewMock);
        mockGetLayoutNetwork(compactEditConfig, compactEditMock);

        const compactView = await setupElement(compactViewConfig, GetLayout);

        expect(compactView.pushCount()).toBe(1);
        expect(compactView.getWiredData()).toEqualSnapshotWithoutEtags(compactViewMock);

        const compactEdit = await setupElement(compactEditConfig, GetLayout);

        expect(compactEdit.pushCount()).toBe(1);
        expect(compactEdit.getWiredData()).toEqualSnapshotWithoutEtags(compactEditMock);

        // Each should have received 1 push
        expect(compactView.pushCount()).toBe(1);
        expect(compactEdit.pushCount()).toBe(1);
    });

    it('should be a cache miss if two components request same recordTypeId, layoutType, mode with different objectApiName', async () => {
        const recordMock = getMock('record-Opportunity');
        const ADM_WorkMock = getMock('layout-Opportunity-Compact');
        const TestMock = getMock('layout-Test__c-Compact');

        const ADM_WorkConfig = {
            objectApiName: {
                objectApiName: 'Opportunity',
            },
            layoutType: 'Compact',
            mode: 'View',
            recordTypeId: recordMock.recordTypeId,
        };
        const TestConfig = Object.assign({}, ADM_WorkConfig, { objectApiName: 'Test__c' });

        mockGetLayoutNetwork(ADM_WorkConfig, ADM_WorkMock);
        mockGetLayoutNetwork(TestConfig, TestMock);

        const compactView = await setupElement(ADM_WorkConfig, GetLayout);

        expect(compactView.pushCount()).toBe(1);
        expect(compactView.getWiredData()).toEqualSnapshotWithoutEtags(ADM_WorkMock);

        const compactEdit = await setupElement(TestConfig, GetLayout);

        expect(compactEdit.pushCount()).toBe(1);
        expect(compactEdit.getWiredData()).toEqualSnapshotWithoutEtags(TestMock);

        // Each should have received 1 push
        expect(compactView.pushCount()).toBe(1);
        expect(compactEdit.pushCount()).toBe(1);
    });

    it('refresh should refresh layout', async () => {
        const recordMock = getMock('record-Opportunity');
        const mock = getMock('layout-Opportunity-Full');
        const refreshed = getMock('layout-Opportunity-Full');
        refreshed.eTag = 'changed';
        refreshed.sections[0].collapsible = !refreshed.sections[0].collapsible;

        const config = {
            objectApiName: 'Opportunity',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: recordMock.recordTypeId,
        };

        mockGetLayoutNetwork(config, [mock, refreshed]);

        const element = await setupElement(config, GetLayout);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });
});
