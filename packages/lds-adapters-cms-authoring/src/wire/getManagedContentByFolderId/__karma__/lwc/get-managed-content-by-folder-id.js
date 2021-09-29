import { LightningElement, api, wire } from 'lwc';
import { getManagedContentByFolderId } from 'lds-adapters-cms-authoring';

export default class GetManagedContentByFolderId extends LightningElement {
    @api folderId;

    wirePushCount = -1;

    @wire(getManagedContentByFolderId, {
        folderId: '$folderId',
    })
    onGetManagedContentByFolderId(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    getData() {
        return this.data;
    }

    @api
    getError() {
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
