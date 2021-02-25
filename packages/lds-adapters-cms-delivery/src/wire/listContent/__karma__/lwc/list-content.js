import { LightningElement, wire, api } from 'lwc';
import { listContent } from 'lds-adapters-cms-delivery';

export default class ListContent extends LightningElement {
    wirePushCount = -1;

    @api communityId;

    @wire(listContent, { communityId: '$communityId' })
    onListContent(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get contentList() {
        return this.data;
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
