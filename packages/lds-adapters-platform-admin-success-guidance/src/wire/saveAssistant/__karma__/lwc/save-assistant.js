import { api, LightningElement, track, wire } from 'lwc';
import { saveAssistant, getAssistant } from 'lds-adapters-platform-admin-success-guidance';

export default class SaveAssistant extends LightningElement {
    @track assistantData;
    @track assistantName;
    @track error;
    @wire(getAssistant, {
        assistantName: '$assistantName',
    })
    assistantWireResult;

    @api
    invokeSaveAssistant({ assistantName, assistantData }) {
        saveAssistant({ assistantName, assistantData })
            .then((data) => {
                this.assistantName = assistantName;
                this.assistantData = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @api
    getAssistant() {
        return this.assistantData;
    }

    @api
    getAssistantWire() {
        return this.assistantWireResult && this.assistantWireResult.data;
    }

    @api
    getError() {
        return this.error;
    }
}
