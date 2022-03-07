import { api, LightningElement, wire } from 'lwc';
import { getContractDocumentVersion } from 'lds-adapters-industries-clm';

export default class GetContractDetail extends LightningElement {
    wirePushCount = -1;
    @api contractId;
    @api contractDocumentVersionId;

    @wire(getContractDocumentVersion, {
        contractId: '$contractId',
        contractDocumentVersionId: '$contractDocumentVersionId',
    })
    onGetContractDetails({ data, error }) {
        this.response = data;
        this.error = error;
        this.wirePushCount += 1;
    }
    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
    @api
    getWiredContractDetails() {
        return this.response;
    }
}
