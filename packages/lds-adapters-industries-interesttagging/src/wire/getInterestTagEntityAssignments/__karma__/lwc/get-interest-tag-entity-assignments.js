import { api, LightningElement, wire } from 'lwc';
import { getInterestTagEntityAssignments } from 'lds-adapters-industries-interesttagging';

export default class GetInterestTagEntityAssignments extends LightningElement {
    @api tagId;
    wirePushCount = -1;

    @wire(getInterestTagEntityAssignments, {
        tagId: '$tagId',
    })
    onGetInterestTagEntityAssignments({ data, error }) {
        this.recordDetail = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api getWiredRecordDetail() {
        return this.recordDetail;
    }

    @api getError() {
        return this.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
