import { api, LightningElement, wire } from 'lwc';
import { getMorePatientScores } from 'lds-adapters-industries-healthcloud-hpi';

export default class GetMorePatientScores extends LightningElement {
    @api scoreId;

    @api limitBy;
    @api searchTerm;
    @api recordType;
    @api startIndex;
    @api range;

    @wire(getMorePatientScores, {
        scoreId: '$scoreId',
        limitBy: '$limitBy',
        searchTerm: '$searchTerm',
        recordType: '$recordType',
        startIndex: '$startIndex',
        range: '$range',
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
