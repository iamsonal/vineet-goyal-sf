import { api, LightningElement, track, wire } from 'lwc';
import { saveAssistant, getAssistant } from 'lds-adapters-platform-admin-success-guidance';

export default class SaveAssistant extends LightningElement {
    @track assistantData;
    @track assistantGroup;
    @track error;
    @wire(getAssistant, {
        assistantGroup: '$assistantGroup',
    })
    assistantWireResult;

    @api
    invokeSaveAssistant({ assistantGroup, assistantData }) {
        saveAssistant({ assistantGroup, assistantData })
            .then(({ data }) => {
                this.assistantData = data;
                this.assistantGroup = assistantGroup;
            })
            .catch(error => {
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
        return this.error.body;
    }
}
