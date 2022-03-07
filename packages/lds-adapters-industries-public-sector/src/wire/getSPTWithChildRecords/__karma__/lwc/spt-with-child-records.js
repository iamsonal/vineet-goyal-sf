import { api, LightningElement, wire } from 'lwc';
import { getSPTWithChildRecords } from 'lds-adapters-industries-public-sector';
export default class SptWithChildRecords extends LightningElement {
    wirePushCount = -1;
    @api servicePlanTemplateId;

    @wire(getSPTWithChildRecords, {
        servicePlanTemplateId: '$servicePlanTemplateId',
    })
    onGetSPTWithChildRecords({ data, error }) {
        this.sptWithChildRecords = data;
        this.error = error;
        this.wirePushCount += 1;
    }
    @api
    getWiredSPTWithChildRecords() {
        return this.sptWithChildRecords;
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
