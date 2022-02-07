import { LightningElement, api, wire } from 'lwc';
import { getFeaturedItemsRelatedList } from 'lds-adapters-platform-learning-content';

export default class GetFeaturedItemsRelatedList extends LightningElement {
    wirePushCount = -1;

    @api appId;

    @api pageRef;

    @wire(getFeaturedItemsRelatedList, {
        pageRef: '$pageRef',
        appId: '$appId',
    })
    onGetFeaturedItemsRelatedList({ data, error }) {
        this.relatedList = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredRelatedList() {
        return this.relatedList;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
}
