import { api, LightningElement, wire } from 'lwc';
import { getStories } from 'lds-adapters-analytics-smart-data-discovery';

export default class GetStories extends LightningElement {
    wirePushCount = -1;

    @api folderId;
    @api inputId;
    @api page;
    @api pageSize;
    @api q;
    @api scope;
    @api sourceType;
    @api sourceTypes;

    @wire(getStories, {
        folderId: '$folderId',
        inputId: '$inputId',
        page: '$page',
        pageSize: '$pageSize',
        q: '$q',
        scope: '$scope',
        sourceType: '$sourceType',
        sourceTypes: '$sourceTypes',
    })
    onGetStories({ data, error }) {
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
