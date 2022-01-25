import { api, LightningElement, wire } from 'lwc';
import { searchActiveBenefitsByName } from 'lds-adapters-industries-public-sector';
export default class SearchActiveBenefitsByName extends LightningElement {
    wirePushCount = -1;
    @api searchKey;

    @wire(searchActiveBenefitsByName, {
        searchKey: '$searchKey',
    })
    onSearchActiveBenefitsByName({ data, error }) {
        this.benefits = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredBenefits() {
        return this.benefits;
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
