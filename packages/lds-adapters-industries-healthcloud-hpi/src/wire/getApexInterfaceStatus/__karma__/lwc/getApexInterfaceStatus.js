import { api, LightningElement, wire } from 'lwc';
import { getApexInterfaceStatus } from 'lds-adapters-industries-healthcloud-hpi';

export default class GetApexInterfaceStatus extends LightningElement {
    @api apexInterfaceName;

    @wire(getApexInterfaceStatus, {
        apexInterfaceName: '$apexInterfaceName',
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
