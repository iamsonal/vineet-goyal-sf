import { LightningElement, wire, api } from 'lwc';
import { getManagedContent } from 'lds-adapters-cms-authoring';

export default class GetManagedContent extends LightningElement {
    wirePushCount = -1;

    @api contentKeyOrId;
    @api version;
    @api language;

    @wire(getManagedContent, {
        contentKeyOrId: '$contentKeyOrId',
        version: '$version',
        language: '$language',
    })
    onGetManagedContent(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get content() {
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
