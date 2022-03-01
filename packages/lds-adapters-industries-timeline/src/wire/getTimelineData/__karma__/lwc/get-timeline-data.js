import { LightningElement, wire, api } from 'lwc';
import { getTimelineData } from 'lds-adapters-industries-timeline';

export default class GetTimelineData extends LightningElement {
    wirePushCount = -1;

    @api timelineConfigFullName;
    @api timelineObjRecordId;
    @api direction;
    @api endDate;
    @api eventTypeOffsets;
    @api eventTypes;
    @api startDate;

    @wire(getTimelineData, {
        timelineConfigFullName: '$timelineConfigFullName',
        timelineObjRecordId: '$timelineObjRecordId',
        direction: '$direction',
        endDate: '$endDate',
        eventTypeOffsets: '$eventTypeOffsets',
        eventTypes: '$eventTypes',
        startDate: '$startDate',
    })
    onGetTimelineData({ data, error }) {
        this.recordDetail = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api getWiredRecordDetail() {
        return this.recordDetail;
    }

    @api
    get pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
}
