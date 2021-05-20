import { LightningElement, wire, api } from 'lwc';
import { getContentTypeInternal } from 'lds-adapters-cms-type';

export default class GetContentTypeInternal extends LightningElement {
    wirePushCount = -1;

    @api contentTypeIdOrFQN;

    @wire(getContentTypeInternal, {
        contentTypeIdOrFQN: '$contentTypeIdOrFQN',
    })
    onGetContentTypeInternal(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get contentType() {
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
