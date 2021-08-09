import { api, LightningElement, wire } from 'lwc';
import { getWaveFolders } from 'lds-adapters-analytics-wave';

export default class GetWaveFolders extends LightningElement {
    wirePushCount = -1;

    @api templateSourceId;
    @api page;
    @api pageSize;
    @api q;
    @api sort;
    @api isPinned;
    @api scope;
    @api mobileOnlyFeaturedAssets;

    @wire(getWaveFolders, {
        templateSourceId: '$templateSourceId',
        page: '$page',
        pageSize: '$pageSize',
        q: '$q',
        sort: '$sort',
        isPinned: '$isPinned',
        scope: '$scope',
        mobileOnlyFeaturedAssets: '$mobileOnlyFeaturedAssets',
    })
    onGetWaveFolders({ data, error }) {
        this.data = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.data;
    }

    @api
    getWiredError() {
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
