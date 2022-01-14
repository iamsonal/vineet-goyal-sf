import { api, LightningElement, wire } from 'lwc';
import { getActionsDetails } from 'lds-adapters-industries-healthcloud-hpi';

export default class GetActionsDetails extends LightningElement {
    @api payload;

    @api actions;
    @api formFactor;
    @api recordId;

    @wire(getActionsDetails, {
        actions: '$actions',
        formFactor: '$formFactor',
        recordId: '$recordId',
    })
    onGetActionsDetails({ data, error }) {
        this.response = data;
        this.error = error;
    }

    @api
    getWiredResponse() {
        return this.response;
    }
    @api
    getError() {
        return this.error;
    }
}
