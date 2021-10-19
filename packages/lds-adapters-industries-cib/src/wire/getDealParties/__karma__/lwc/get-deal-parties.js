import { api, LightningElement, wire } from 'lwc';
import { getDealParties } from 'lds-adapters-industries-cib';

export default class GetDealParties extends LightningElement {
    wirePushCount = -1;

    @api financialDealId;
    @api partyRoles;

    @wire(getDealParties, {
        financialDealId: '$financialDealId',
        partyRoles: '$partyRoles',
    })
    onGetDealParties({ data, error }) {
        this.data = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredDealParties() {
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
