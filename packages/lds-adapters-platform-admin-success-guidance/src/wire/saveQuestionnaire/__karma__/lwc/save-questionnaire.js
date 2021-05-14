import { api, LightningElement, wire, track } from 'lwc';
import { saveQuestionnaire, getQuestionnaire } from 'lds-adapters-platform-admin-success-guidance';

export default class SaveQuestionnaire extends LightningElement {
    @track questionnaireData;
    @track questionnaireId;
    @track assistantGroup;
    @track error;

    @wire(getQuestionnaire, {
        assistantGroup: '$assistantGroup',
        questionnaireId: '$questionnaireId',
    })
    questionnaireWireResult;

    @api
    invokeSaveQuestionnaire({ assistantGroup, questionnaireData, questionnaireId }) {
        saveQuestionnaire({ assistantGroup, questionnaireId, questionnaireData })
            .then(({ data }) => {
                this.questionnaireId = questionnaireId;
                this.assistantGroup = assistantGroup;
                this.questionnaireData = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @api
    getQuestionnaire() {
        return this.questionnaireData;
    }

    @api
    getQuestionnaireWire() {
        return this.questionnaireWireResult && this.questionnaireWireResult.data;
    }

    @api
    getError() {
        return this.error.body;
    }
}
