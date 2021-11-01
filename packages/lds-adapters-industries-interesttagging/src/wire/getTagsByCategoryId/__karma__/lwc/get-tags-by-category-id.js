import { api, LightningElement, wire } from 'lwc';
import { getTagsByCategoryId } from 'lds-adapters-industries-interesttagging';

export default class GetTagsByCategoryId extends LightningElement {
    @api categoryId;
    wirePushCount = -1;

    @wire(getTagsByCategoryId, {
        categoryId: '$categoryId',
    })
    onGetTagsByCategoryId({ data, error }) {
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
