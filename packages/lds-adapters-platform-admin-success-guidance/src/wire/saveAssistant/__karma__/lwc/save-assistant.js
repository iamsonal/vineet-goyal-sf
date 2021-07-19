import { api, LightningElement, track, wire } from 'lwc';
import { saveAssistant, getAssistant } from 'lds-adapters-platform-admin-success-guidance';

export default class SaveAssistant extends LightningElement {
    @track assistantData;
    @track assistantGroup;
    @track error;
    @track scenarioId;
    @wire(getAssistant, {
        assistantGroup: '$assistantGroup',
        scenarioId: '$scenarioId',
    })
    assistantWireResult;

    @api
    invokeSaveAssistant({ assistantGroup, assistantData, scenarioId }) {
        saveAssistant({ assistantGroup, assistantData, scenarioId })
            .then((data) => {
                this.assistantData = data;
                this.assistantGroup = assistantGroup;
                this.scenarioId = scenarioId;
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
        return this.error.body;
    }
}
