import { LightningElement, wire, api } from 'lwc';
import { getLayoutUserState, refresh } from 'lds';

export default class GetLayoutUserState extends LightningElement {
    @api objectApiName;
    @api formFactor;
    @api layoutType;
    @api mode;
    @api recordTypeId;
    wirePushCount = -1;

    @wire(getLayoutUserState, {
        objectApiName: '$objectApiName',
        formFactor: '$formFactor',
        layoutType: '$layoutType',
        mode: '$mode',
        recordTypeId: '$recordTypeId',
    })
    onGetLayoutUserState(result) {
        this.layoutUserState = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.layoutUserState.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api getWiredError() {
        return this.layoutUserState.error;
    }

    @api refresh() {
        return refresh(this.layoutUserState);
    }
}
