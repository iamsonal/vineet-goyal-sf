import { api, LightningElement, wire } from 'lwc';
import { getTagCategoriesByTagId } from 'lds-adapters-industries-interesttagging';

export default class GetTagCategoriesByTagId extends LightningElement {
    @api tagId;
    wirePushCount = -1;

    @wire(getTagCategoriesByTagId, {
        tagId: '$tagId',
    })
    onGetTagCategoriesByTagId({ data, error }) {
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
