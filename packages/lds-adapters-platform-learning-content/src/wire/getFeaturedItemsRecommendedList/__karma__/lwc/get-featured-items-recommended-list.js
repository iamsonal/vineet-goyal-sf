import { api, LightningElement, wire } from 'lwc';
import { getFeaturedItemsRecommendedList } from 'lds-adapters-platform-learning-content';

export default class GetFeaturedItemsRecommendedList extends LightningElement {
    wirePushCount = -1;

    @api appId;

    @wire(getFeaturedItemsRecommendedList, {
        appId: '$appId',
    })
    onGetFeaturedItemsRecommendedList({ data, error }) {
        this.recommendedList = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredRecommendedList() {
        return this.recommendedList;
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
