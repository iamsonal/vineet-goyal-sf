import { LightningElement, wire, api } from 'lwc';
import { getContentType } from 'lds-adapters-cms-type';

export default class ContentType extends LightningElement {
    wirePushCount = -1;

    @api contentTypeFQN;

    @wire(getContentType, {
        contentTypeFQN: '$contentTypeFQN',
    })
    onGetContentType(results) {
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
