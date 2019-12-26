import { LightningElement, wire, api } from 'lwc';
import { getLayout, refresh } from 'lds';

export default class GetLayout extends LightningElement {
    @api objectApiName;
    @api layoutType;
    @api mode;
    @api recordTypeId;
    wirePushCount = -1;

    @wire(getLayout, {
        objectApiName: '$objectApiName',
        layoutType: '$layoutType',
        mode: '$mode',
        recordTypeId: '$recordTypeId',
    })
    onGetLayout(result) {
        this.layout = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.layout.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api getWiredError() {
        return this.layout.error;
    }

    @api refresh() {
        return refresh(this.layout);
    }
}
