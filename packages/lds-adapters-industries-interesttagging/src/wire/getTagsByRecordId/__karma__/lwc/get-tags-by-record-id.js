import { api, LightningElement, wire } from 'lwc';
import { getTagsByRecordId } from 'lds-adapters-industries-interesttagging';

export default class GetTagsByRecordId extends LightningElement {
    @api recordId;
    wirePushCount = -1;

    @wire(getTagsByRecordId, {
        recordId: '$recordId',
    })
    onGetTagsByRecordId({ data, error }) {
        this.tagDetail = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api getWiredTagDetail() {
        return this.tagDetail;
    }

    @api getError() {
        return this.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
