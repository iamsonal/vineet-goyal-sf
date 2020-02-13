import { LightningElement, wire, api } from 'lwc';
import { listContent } from 'lds';

export default class ListContent extends LightningElement {
    wirePushCount = -1;
    @api channelId;
    @api includeMetadata;

    @wire(listContent, { channelId: '$channelId', includeMetadata: '$includeMetadata' })
    onListContent(results) {
        this.data = results.data;
        this.wirePushCount += 1;
    }

    @api
    get pushCount() {
        return this.wirePushCount;
    }

    @api
    get items() {
        return this.data.items;
    }

    @api
    get managedContentTypes() {
        return this.data.managedContentTypes;
    }
}
